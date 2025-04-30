import type { Cell } from '../cell/Cell'
import type { Mx } from '../Mx'
import { CellReference } from '../reference/CellReference'
import { RangeReference } from '../reference/RangeReference'
import type { Grid } from './Grid'

export type SpillValue = {
  value: unknown
  source: Cell
}

export class SpillHandler {
  private spills = new Map<Cell, RangeReference>()
  private logger = useLogger().createLogger('PubSub')

  constructor(private grid: Grid) {}

  public getSpillRange(source: Cell): RangeReference | undefined {
    return this.spills.get(source)
  }

  public removeSpill(source: Cell): void {
    const existingRange = this.spills.get(source)
    if (existingRange) {
      existingRange.getCells().forEach((c) => {
        c.spillValue.value = null
      })
      this.spills.delete(source)
    }
  }

  public intersectsSpill(rangeReference: RangeReference): boolean {
    return this.spills.values().some(spillRange => spillRange.intersects(rangeReference))
  }

  public addSpill(source: Cell, spillMatrix: Mx<unknown>): void {
    const spillRange = RangeReference.fromCellReferences(
      source.cellReference.value,
      CellReference.fromCoords(this.grid, {
        rowIndex: source.cellReference.value.rowIndex + spillMatrix.rows().length - 1,
        colIndex: source.cellReference.value.colIndex + spillMatrix.cols().length - 1,
      }),
    )

    if (!this.grid.gridRange.value.contains(spillRange)) {
      this.grid.project.pubSub.publish({
        type: 'Alert',
        eventName: 'error',
        data: {
          title: 'Spill range out of bounds',
          body: 'Spill range is out of bounds',
        },
      })
      this.removeSpill(source)
      return
    }

    // Check if the spill range intersects with any other spills

    const existingSpillCells = new Set(this.spills.get(source)?.getCells() ?? [])

    if (spillRange.getCells().some(cell => !existingSpillCells.has(cell) && cell.readonly.value)) {
      this.grid.project.pubSub.publish({
        type: 'Alert',
        eventName: 'error',
        data: {
          title: 'Readonly cell',
          body: 'Cannot spill into readonly cells',
        },
      })
      this.removeSpill(source)
      return
    }

    if (spillRange.getCells().some(cell => cell !== source && cell.input.value)) {
      this.grid.project.pubSub.publish({
        type: 'Alert',
        eventName: 'error',
        data: {
          title: 'Non-empty cell',
          body: 'Cannot spill into non-empty cells',
        },
      })
      this.removeSpill(source)
      return
    }

    const cells = spillRange.getCells()
    const existingRange = this.spills.get(source)
    this.spills.set(source, spillRange)

    // reset spill values for cells that are no longer in the spill range
    existingRange?.getCells().forEach((c) => {
      if (!cells.includes(c)) {
        c.spillValue.value = null
      }
    })

    // set spill values for new cells in the spill range
    cells.forEach((c) => {
      const row = c.cellReference.value.rowIndex - source.cellReference.value.rowIndex
      const col = c.cellReference.value.colIndex - source.cellReference.value.colIndex
      const value = spillMatrix.get(row, col)
      c.spillValue.value = { value, source }
    })
  }
}
