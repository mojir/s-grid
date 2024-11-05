import type { ShallowRef } from 'vue'
import { Cell } from './Cell'
import { CellId } from './CellId'
import { CellRange } from './CellRange'
import { CellStyle, getLineHeight, type CellStyleName } from './CellStyle'
import type { Col } from './Col'
import type { Color } from './color'
import type { Row } from './Row'

const minRowHeight = 16

export type CellOrRangeTarget = string | CellId | CellRange
export type CellTarget = string | CellId

export class Grid {
  public readonly cells: Cell[][]
  public readonly position: Ref<CellId>
  private readonly gridRange: ComputedRef<CellRange>

  constructor(
    public readonly colorMode: Ref<Ref<string> | null>,
    private readonly rows: Readonly<ShallowRef<Row[]>>,
    private readonly cols: Readonly<ShallowRef<Col[]>>,
  ) {
    this.position = ref(CellId.fromCoords(0, 0))
    this.cells = Array.from({ length: rows.value.length }, (_, rowIndex) =>
      Array.from({ length: cols.value.length }, (_, colIndex) => new Cell(this, CellId.fromCoords(rowIndex, colIndex))),
    )
    this.gridRange = computed(() => CellRange.fromDimensions(0, 0, rows.value.length - 1, cols.value.length - 1))
  }

  public setInput(input: string, target?: CellOrRangeTarget) {
    this.getCells(target).forEach((cell) => {
      cell.input.value = input
    })
  }

  private getCellId(target?: CellTarget): CellId {
    if (target === undefined) {
      return useSelection().selection.value.start
    }

    if (CellId.isCellId(target)) {
      return target
    }
    const cell = useAlias().getAlias(target)
    return cell ? cell.cellId : CellId.fromId(target)
  }

  public getCurrentCell(): Cell {
    return this.getCell(this.position.value)
  }

  public getCell(target?: CellTarget): Cell {
    const cellId = this.getCellId(target)
    const cell = this.cells[cellId.rowIndex][cellId.colIndex]
    if (!cell) {
      throw new Error(`Cell ${cellId.id} is out of range`)
    }

    return cell
  }

  public getCells(target?: CellOrRangeTarget): Cell[] {
    if (!target) {
      return useSelection().selection.value.getAllCellIds().map(cellId => this.getCell(cellId))
    }
    else if (CellRange.isCellRange(target)) {
      return target.getAllCellIds().map(cellId => this.getCell(cellId))
    }
    else if (CellRange.isCellRangeString(target)) {
      return CellRange.fromId(target).getAllCellIds().map(cellId => this.getCell(cellId))
    }
    else if (CellId.isCellId(target)) {
      return [this.getCell(target)]
    }
    else if (CellId.isCellIdString(target)) {
      return [this.getCell(target)]
    }

    throw new Error(`Invalid target: ${JSON.stringify(target)}`)
  }

  public clear(target?: CellOrRangeTarget) {
    this.getCells(target).forEach((cell) => {
      cell.input.value = ''
      cell.backgroundColor.value = null
      cell.textColor.value = null
      cell.style.value = new CellStyle()
    })
  }

  public clearAllCells() {
    this.clear(this.gridRange.value)
  }

  public getValuesFromUndefinedIdentifiers(unresolvedIdentifiers: string[]) {
    return [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, target) => {
      const aliasCell = useAlias().getAlias(target)
      if (aliasCell) {
        acc[target] = aliasCell.output.value
      }
      else if (CellId.isCellIdString(target)) {
        const cell = this.getCell(target)
        acc[target] = cell.output.value
      }
      else if (CellRange.isCellRangeString(target)) {
        const data = CellRange.fromId(target).getStructuredCellIds()
        if (data.matrix) {
          const matrixValues: unknown[][] = []
          for (const row of data.matrix) {
            const rowValues: unknown[] = []
            matrixValues.push(rowValues)
            for (const cellId of row) {
              const cell = this.getCell(cellId)
              rowValues.push(cell.output.value)
            }
          }
          acc[target] = matrixValues
        }
        else {
          const arrayValues: unknown[] = []
          for (const cellId of data.array) {
            const cell = this.getCell(cellId)
            arrayValues.push(cell.output.value)
          }
          acc[target] = arrayValues
        }
      }
      else {
        console.error(`Unknown identifier ${target}`)
      }
      return acc
    }, {})
  }

  public movePositionTo(target: CellTarget) {
    const cellId = this.getCellId(target)
    this.position.value = cellId.clamp(this.gridRange.value)

    if (!useSelection().selection.value.contains(this.position.value)) {
      useSelection().updateSelection(CellRange.fromSingleCellId(this.position.value))
    }
  }

  public movePosition(dir: Direction, wrap = false) {
    const selection = useSelection().selection.value
    const range = wrap && selection.size() > 1 ? selection : this.gridRange.value

    switch (dir) {
      case 'up':
        this.movePositionTo(this.position.value.cellUp(range, wrap))
        break
      case 'down':
        this.movePositionTo(this.position.value.cellDown(range, wrap))
        break
      case 'left':
        this.movePositionTo(this.position.value.cellLeft(range, wrap))
        break
      case 'right':
        this.movePositionTo(this.position.value.cellRight(range, wrap))
        break
      case 'top':
        this.movePositionTo(this.position.value.cellTop(range))
        break
      case 'bottom':
        this.movePositionTo(this.position.value.cellBottom(range))
        break
      case 'leftmost':
        this.movePositionTo(this.position.value.cellLeftmost(range))
        break
      case 'rightmost':
        this.movePositionTo(this.position.value.cellRightmost(range))
        break
    }
  }

  public setBackgroundColor(color: Color | null, target?: CellOrRangeTarget): void {
    const cells = this.getCells(target)

    cells.forEach((cell) => {
      cell.backgroundColor.value = color
    })
  }

  public getBackgroundColor(target?: CellOrRangeTarget): Color | null {
    const cells = this.getCells(target)
    const color = cells[0]?.backgroundColor.value ?? null

    return cells.slice(1).every(cell => cell.backgroundColor.value === color) ? color : null
  }

  public setTextColor(color: Color | null, target?: CellOrRangeTarget): void {
    const cells = this.getCells(target)

    console.log('cells', cells)
    cells.forEach((cell) => {
      cell.textColor.value = color
    })
  }

  public getTextColor(target?: CellOrRangeTarget): Color | null {
    const cells = this.getCells(target)
    const color = cells[0]?.textColor.value ?? null

    return cells.slice(1).every(cell => cell.textColor.value === color) ? color : null
  }

  public setStyle<T extends CellStyleName>(property: T, value: CellStyle[T], target?: CellOrRangeTarget): void {
    const cells = this.getCells(target)

    cells.forEach((cell) => {
      cell.style.value[property] = value
    })
  }

  public getStyle<T extends CellStyleName>(property: T, target?: CellOrRangeTarget): CellStyle[T] {
    const cells = this.getCells(target)
    const styleValue = cells[0]?.style.value[property]

    return cells.slice(1).every(cell => cell.style.value[property] === styleValue) ? styleValue : undefined
  }

  public setFormatter(formatter: string | null, target?: CellOrRangeTarget): void {
    const cells = this.getCells(target)

    cells.forEach((cell) => {
      cell.formatter.value = formatter
    })
  }

  public getFormatter(target?: CellOrRangeTarget): string | null {
    const cells = this.getCells(target)
    const formatter = cells[0]?.formatter.value ?? null

    return cells.slice(1).every(cell => cell.formatter.value === formatter) ? formatter : null
  }

  public autoSetRowHeight(id?: CellId | string) {
    const cellIds = id
      ? [CellId.isCellId(id) ? id : CellId.fromId(id)]
      : useSelection().selection.value.getAllCellIds()

    cellIds.forEach((cellId) => {
    // No need to auto set row height for cell, if cell is empty
      if (!this.getCell(cellId)?.display.value) {
        return
      }

      const rowIndex = cellId.rowIndex
      const cells = this.getRowCells(rowIndex)

      const maxLineHeight = cells.reduce((acc, cell) => {
        if (!cell.display.value) {
          return acc
        }
        const lineHeight = getLineHeight(cell.style.value.fontSize)
        return lineHeight > acc ? lineHeight : acc
      }, 0)

      this.rows.value[rowIndex].height.value = Math.max(maxLineHeight, minRowHeight)
    })
  }

  public getRowCells(rowIndex: number): Cell[] {
    const startCellId = CellId.fromCoords(rowIndex, 0)
    const endCellId = CellId.fromCoords(rowIndex, this.cols.value.length - 1)
    const range = CellRange.fromCellIds(startCellId, endCellId)
    return range
      .getAllCellIds()
      .flatMap(cellId => this.getCell(cellId) ?? [])
  }
}
