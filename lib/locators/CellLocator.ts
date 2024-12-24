import { cellLocatorRegExp } from '../constants'
import { getColId, getColNumber, getRowId, getRowNumber } from '../utils'
import type { Grid } from '../grid/Grid'
import type { Cell } from '../Cell'
import { RangeLocator } from './RangeLocator'
import { ColLocator } from './ColLocator'
import { RowLocator } from './RowLocator'
import type { Movement } from './utils'
import { CommonLocator } from './CommonLocator'
import type { Locator } from './Locator'

export function isCellLocatorString(id: string): boolean {
  return cellLocatorRegExp.test(id)
}

export class CellLocator extends CommonLocator implements Locator {
  public readonly absCol: boolean
  public readonly col: number
  public readonly absRow: boolean
  public readonly row: number

  public constructor(
    {
      grid,
      absCol,
      col,
      absRow,
      row,
    }: {
      grid: Grid
      absCol: boolean
      col: number
      absRow: boolean
      row: number
    },
  ) {
    if (col < 0) {
      throw new Error(`Col ${col} is out of range`)
    }
    if (row < 0) {
      throw new Error(`Row ${row} is out of range`)
    }
    if (col > 26 * 26) {
      throw new Error(`Col ${col} is out of range`)
    }
    if (row > 9999) {
      throw new Error(`Row ${row} is out of range`)
    }

    super(grid)
    this.absCol = absCol
    this.col = col
    this.absRow = absRow
    this.row = row
  }

  static fromString(grid: Grid, str: string): CellLocator {
    const match = str.match(cellLocatorRegExp)
    if (!match) {
      throw new Error(`Invalid cell locator: ${str}`)
    }

    grid = match[1] ? grid.project.getGrid(match[1]) : grid
    const absCol = !!match[2]
    const colId = match[3]
    const col = getColNumber(colId)
    const absRow = !!match[4]
    const rowId = match[5]
    const row = getRowNumber(rowId)
    return new CellLocator({
      grid,
      absCol,
      col,
      absRow,
      row,
    })
  }

  static fromCoords(grid: Grid, { row, col }: { row: number, col: number }): CellLocator {
    return new CellLocator({
      grid,
      absCol: false,
      col,
      absRow: false,
      row,
    })
  }

  static fromRowCol({ rowLocator, colLocator }: { rowLocator: RowLocator, colLocator: ColLocator }): CellLocator {
    if (rowLocator.grid !== colLocator.grid) {
      throw new Error('Row and col locators must be from the same grid')
    }
    return new CellLocator({
      grid: rowLocator.grid,
      absCol: colLocator.absCol,
      col: colLocator.col,
      absRow: rowLocator.absRow,
      row: rowLocator.row,
    })
  }

  public toRangeLocator(): RangeLocator {
    return RangeLocator.fromCellLocator(this)
  }

  public getCell(): Cell {
    return this.grid.cells[this.row][this.col]
  }

  public getValue(): unknown {
    return this.getCell().output.value
  }

  public getCells(): Cell[] {
    return [this.getCell()]
  }

  public override toStringWithoutGrid(): string {
    return `${this.absCol ? '$' : ''}${getColId(this.col)}${this.absRow ? '$' : ''}${getRowId(this.row)}`
  }

  public override equals(other: Locator): boolean {
    if (other instanceof CellLocator) {
      return other.grid === this.grid && other.col === this.col && other.row === this.row
    }
    return this.toRangeLocator().equals(other)
  }

  public getRowLocator(): RowLocator {
    return new RowLocator({
      grid: this.grid,
      absRow: this.absRow,
      row: this.row,
    })
  }

  public getColLocator(): ColLocator {
    return new ColLocator({
      grid: this.grid,
      absCol: this.absCol,
      col: this.col,
    })
  }

  public toRelative(): CellLocator {
    return new CellLocator({
      grid: this.grid,
      absCol: false,
      col: this.col,
      absRow: false,
      row: this.row,
    })
  }

  public clamp(range: RangeLocator): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    const clampedRow = Math.max(startRow, Math.min(this.row, endRow))
    const clampedCol = Math.max(startCol, Math.min(this.col, endCol))
    if (clampedRow === this.row && clampedCol === this.col) {
      return this
    }
    return new CellLocator({
      grid: this.grid,
      absCol: this.absCol,
      col: clampedCol,
      absRow: this.absRow,
      row: clampedRow,
    })
  }

  public move(movement: Movement): CellLocator {
    return new CellLocator({
      grid: movement.toGrid,
      absCol: this.absCol,
      col: this.col + (movement.deltaCol ?? 0),
      absRow: this.absRow,
      row: this.row + (movement.deltaRow ?? 0),
    })
  }
}
