import { rangeLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import { getColId, getRowId } from '../utils'
import { CellLocator } from './CellLocator'
import { ColLocator } from './ColLocator'
import { CommonLocator } from './CommonLocator'

import { RowLocator } from './RowLocator'
import type { Movement } from './utils'

export function isRangeLocatorString(value: string): boolean {
  const match = rangeLocatorRegExp.exec(value)
  if (!match) {
    return false
  }
  const { colStart, rowStart, colEnd, rowEnd } = match.groups ?? {}
  if ((colStart && rowEnd) || (rowStart && colEnd)) {
    return false
  }
  return true
}

type Coords = {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

function getStartString({ col, row, cell }: { col?: string, row?: string, cell?: string }): string {
  return row ? `A${row}` : col ? `${col}1` : cell!
}

function getEndString(grid: Grid, { col, row, cell }: { col?: string, row?: string, cell?: string }): string {
  return row ? `${getColId(grid.cols.value.length - 1)}${row}` : col ? `${col}${getRowId(grid.rows.value.length - 1)}` : cell!
}

export class RangeLocator extends CommonLocator {
  public readonly start: CellLocator
  public readonly end: CellLocator

  private constructor(start: CellLocator, end: CellLocator) {
    if (start.grid !== end.grid) {
      throw new Error(`Cannot create cell range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    super(start.grid)
    this.start = start
    this.end = end
  }

  static fromString(grid: Grid, value: string): RangeLocator {
    const match = value.match(rangeLocatorRegExp)

    if (!match?.groups) {
      throw new Error(`Invalid cell range locator: ${value}`)
    }
    const { colStart, rowStart, cellStart, colEnd, rowEnd, cellEnd } = match.groups
    const reverse = !!(cellEnd && !cellStart)

    const startCellString = reverse
      ? getStartString({ col: colEnd, row: rowEnd, cell: cellEnd })
      : getStartString({ col: colStart, row: rowStart, cell: cellStart })

    const endCellString = reverse
      ? getEndString(grid, { col: colStart, row: rowStart, cell: cellStart })
      : getEndString(grid, { col: colEnd, row: rowEnd, cell: cellEnd })

    const gridName = match.groups.grid ?? grid.name.value
    const startString = `${gridName}!${startCellString}`
    const endString = `${gridName}!${endCellString}`
    if (cellEnd && !cellStart) {
      return new RangeLocator(CellLocator.fromString(grid, endString), CellLocator.fromString(grid, startString)).toSorted()
    }
    else {
      return new RangeLocator(CellLocator.fromString(grid, startString), CellLocator.fromString(grid, endString)).toSorted()
    }
  }

  static fromCellLocator(cellLocator: CellLocator): RangeLocator {
    return new RangeLocator(cellLocator, cellLocator)
  }

  static fromCellLocators(start: CellLocator, end: CellLocator): RangeLocator {
    return new RangeLocator(start, end)
  }

  static fromCoords(grid: Grid, coords: Coords): RangeLocator {
    const { startRow, startCol, endRow, endCol } = coords
    return new RangeLocator(
      new CellLocator({ row: startRow, col: startCol, absRow: false, absCol: false, grid }),
      new CellLocator({ row: endRow, col: endCol, absRow: false, absCol: false, grid }),
    )
  }

  public toRangeLocator(): RangeLocator {
    return this
  }

  public override toStringWithoutGrid(): string {
    return `${this.start.toStringWithoutGrid()}-${this.end.toStringWithoutGrid()}`
  }

  public size(): number {
    return Math.abs((this.end.row - this.start.row + 1) * (this.end.col - this.start.col + 1))
  }

  public toSorted(): RangeLocator {
    const start = this.start
    const end = this.end

    if (start.row <= end.row && start.col <= end.col) {
      return this
    }
    else if (start.col <= end.col && start.row > end.row) {
      return new RangeLocator(
        new CellLocator({
          grid: this.grid,
          absCol: start.absCol,
          col: start.col,
          absRow: end.absRow,
          row: end.row,
        }),
        new CellLocator({
          grid: this.grid,
          absCol: end.absCol,
          col: end.col,
          absRow: start.absRow,
          row: start.row,
        }),
      )
    }
    else if (start.col > end.col && start.row <= end.row) {
      return new RangeLocator(
        new CellLocator({
          grid: this.grid,
          absCol: end.absCol,
          col: end.col,
          absRow: start.absRow,
          row: start.row,
        }),
        new CellLocator({
          grid: this.grid,
          absCol: start.absCol,
          col: start.col,
          absRow: end.absRow,
          row: end.row,
        }),
      )
    }
    else {
      return new RangeLocator(
        new CellLocator({
          grid: this.grid,
          absCol: end.absCol,
          col: end.col,
          absRow: end.absRow,
          row: end.row,
        }),
        new CellLocator({
          grid: this.grid,
          absCol: start.absCol,
          col: start.col,
          absRow: start.absRow,
          row: start.row,
        }),
      )
    }
  }

  public getCoords(): Coords {
    const {
      start: { row: startRow, col: startCol },
      end: { row: endRow, col: endCol },
    } = this.toSorted()
    return { startRow, startCol, endRow, endCol }
  }

  public clamp(range: RangeLocator): RangeLocator {
    if (this.grid !== range.grid) {
      throw new Error(`Cannot clamp cell range from different grids: ${this.toStringWithGrid()} and ${range.toStringWithGrid()}`)
    }
    const sorted = this.toSorted()
    const clampedStart = sorted.start.clamp(range)
    const clampedEnd = sorted.end.clamp(range)

    return RangeLocator.fromCellLocators(clampedStart, clampedEnd)
  }

  public getAllCellLocators(): CellLocator[] {
    const cellLocators: CellLocator[] = []

    const { startRow, startCol, endRow, endCol } = this.toSorted().getCoords()

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        cellLocators.push(new CellLocator({
          grid: this.grid,
          absCol: false,
          col,
          absRow: false,
          row,
        }))
      }
    }

    return cellLocators
  }

  public getAllRowLocators(): RowLocator[] {
    const rowLocators: RowLocator[] = []

    const { startRow, endRow } = this.toSorted().getCoords()

    for (let row = startRow; row <= endRow; row += 1) {
      rowLocators.push(new RowLocator({
        grid: this.grid,
        absRow: false,
        row,
      }))
    }

    return rowLocators
  }

  public getAllColLocators(): ColLocator[] {
    const rowLocators: ColLocator[] = []

    const { startCol, endCol } = this.toSorted().getCoords()

    for (let col = startCol; col <= endCol; col += 1) {
      rowLocators.push(new ColLocator({
        grid: this.grid,
        absCol: false,
        col,
      }))
    }

    return rowLocators
  }

  public getCellIdMatrix(): CellLocator[][] {
    const { startRow, startCol, endRow, endCol } = this.toSorted().getCoords()

    const matrix: CellLocator[][] = []
    for (let row = startRow; row <= endRow; row++) {
      const rowArray: CellLocator[] = []
      matrix.push(rowArray)
      for (let col = startCol; col <= endCol; col++) {
        rowArray.push(new CellLocator({
          grid: this.grid,
          absCol: false,
          col,
          absRow: false,
          row,
        }))
      }
    }
    return matrix
  }

  public containsCell(cellLocator: CellLocator): boolean {
    if (this.grid !== cellLocator.grid) {
      return false
    }
    const sorted = this.toSorted()
    return cellLocator.row >= sorted.start.row
      && cellLocator.row <= sorted.end.row
      && cellLocator.col >= sorted.start.col
      && cellLocator.col <= sorted.end.col
  }

  public containsRow(row: number): boolean {
    const sorted = this.toSorted()
    return row >= sorted.start.row && row <= sorted.end.row
  }

  public containsCol(col: number): boolean {
    const sorted = this.toSorted()
    return col >= sorted.start.col && col <= sorted.end.col
  }

  public isCellInTopRow(cellLocator: CellLocator): boolean {
    if (this.grid !== cellLocator.grid) {
      return false
    }
    return cellLocator.row === this.toSorted().start.row
  }

  public isCellBottomRow(cellLocator: CellLocator): boolean {
    if (this.grid !== cellLocator.grid) {
      return false
    }
    return cellLocator.row === this.toSorted().end.row
  }

  public isCellIdLeftColumn(cellLocator: CellLocator): boolean {
    if (this.grid !== cellLocator.grid) {
      return false
    }
    return cellLocator.col === this.toSorted().start.col
  }

  public isCellIdRightColumn(cellLocator: CellLocator): boolean {
    if (this.grid !== cellLocator.grid) {
      return false
    }
    return cellLocator.col === this.toSorted().end.col
  }

  public equals(other: RangeLocator): boolean {
    const sorted = this.toSorted()
    const otherSorted = other.toSorted()
    return sorted.start.isSameCell(otherSorted.start) && sorted.end.isSameCell(otherSorted.end)
  }

  public move(movement: Movement): RangeLocator {
    return RangeLocator.fromCellLocators(this.start.move(movement), this.end.move(movement))
  }
}
