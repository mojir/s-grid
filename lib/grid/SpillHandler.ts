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
  constructor(private grid: Grid) {}

  public removeSpill(source: Cell): void {
    const existingRange = this.spills.get(source)
    if (existingRange) {
      existingRange.getCells().forEach((c) => {
        c.spillValue.value = null
      })
      this.spills.delete(source)
    }
  }

  public addSpill(source: Cell, spillMatrix: Mx<unknown>): boolean {
    const spillRange = RangeReference.fromCellReferences(
      source.cellReference,
      CellReference.fromCoords(this.grid, {
        rowIndex: source.cellReference.rowIndex + spillMatrix.rows().length - 1,
        colIndex: source.cellReference.colIndex + spillMatrix.cols().length - 1,
      }),
    )

    // Check if the spill range intersects with any other spills
    const otherEntries = [...this.spills.keys()].filter(c => c !== source)
    for (const otherEntry of otherEntries) {
      const otherRange = this.spills.get(otherEntry)!
      if (otherRange.intersects(spillRange)) {
        return false
      }
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
      const row = c.cellReference.rowIndex - source.cellReference.rowIndex
      const col = c.cellReference.colIndex - source.cellReference.colIndex
      const value = spillMatrix.get(row, col)
      c.spillValue.value = { value, source }
    })
    return true
  }
}
