import { CellLocator } from './CellLocator'
import { ColLocator } from './ColLocator'
import { CommonLocator } from './CommonLocator'

import { RowLocator } from './RowLocator'
import { rangeLocatorRegExp, type Movement } from './utils'

export function isRangeLocatorString(value: string): boolean {
  return rangeLocatorRegExp.test(value)
}

type Coords = {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export class RangeLocator extends CommonLocator {
  public readonly start: CellLocator
  public readonly end: CellLocator

  private constructor(start: CellLocator, end: CellLocator) {
    super(start.gridName)
    if (start.gridName !== end.gridName) {
      throw new Error(`Cannot create cell range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    this.start = start
    this.end = end
  }

  static fromString(gridName: string, value: string): RangeLocator {
    const match = value.match(rangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid cell range locator: ${value}`)
    }
    gridName = match.groups.grid ?? gridName
    const startString = `${gridName}!${match.groups.start}`
    const endString = `${gridName}!${match.groups.end}`
    return new RangeLocator(CellLocator.fromString(gridName, startString), CellLocator.fromString(gridName, endString))
  }

  static fromCellLocator(cellLocator: CellLocator): RangeLocator {
    return new RangeLocator(cellLocator, cellLocator)
  }

  static fromCellLocators(start: CellLocator, end: CellLocator): RangeLocator {
    return new RangeLocator(start, end)
  }

  static fromCoords(gridName: string, coords: Coords): RangeLocator {
    const { startRow, startCol, endRow, endCol } = coords
    return new RangeLocator(
      new CellLocator({ row: startRow, col: startCol, absRow: false, absCol: false, gridName }),
      new CellLocator({ row: endRow, col: endCol, absRow: false, absCol: false, gridName }),
    )
  }

  public override toString(currentGridName: string): string {
    return this.gridName === currentGridName ? this.toStringWithoutGrid() : this.toStringWithGrid()
  }

  public override toStringWithGrid(): string {
    return `${this.gridName}!${this.toStringWithoutGrid()}`
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
    const gridName = start.gridName

    if (start.row <= end.row && start.col <= end.col) {
      return this
    }
    else if (start.col <= end.col && start.row > end.row) {
      return new RangeLocator(
        new CellLocator({
          gridName,
          absCol: start.absCol,
          col: start.col,
          absRow: end.absRow,
          row: end.row,
        }),
        new CellLocator({
          gridName,
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
          gridName,
          absCol: end.absCol,
          col: end.col,
          absRow: start.absRow,
          row: start.row,
        }),
        new CellLocator({
          gridName,
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
          gridName,
          absCol: end.absCol,
          col: end.col,
          absRow: end.absRow,
          row: end.row,
        }),
        new CellLocator({
          gridName,
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
    if (this.gridName !== range.gridName) {
      throw new Error(`Cannot clamp cell range from different grids: ${this.toStringWithGrid()} and ${range.toStringWithGrid()}`)
    }
    const sorted = this.toSorted()
    const clampedStart = sorted.start.clamp(range)
    const clampedEnd = sorted.end.clamp(range)

    return RangeLocator.fromCellLocators(clampedStart, clampedEnd)
  }

  public getAllCellLocators(): CellLocator[] {
    const cellLocators: CellLocator[] = []
    const gridName = this.start.gridName

    const { startRow, startCol, endRow, endCol } = this.toSorted().getCoords()

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        cellLocators.push(new CellLocator({
          gridName,
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
    const gridName = this.start.gridName

    const { startRow, endRow } = this.toSorted().getCoords()

    for (let row = startRow; row <= endRow; row += 1) {
      rowLocators.push(new RowLocator({
        gridName,
        absRow: false,
        row,
      }))
    }

    return rowLocators
  }

  public getAllColLocators(): ColLocator[] {
    const rowLocators: ColLocator[] = []
    const gridName = this.start.gridName

    const { startCol, endCol } = this.toSorted().getCoords()

    for (let col = startCol; col <= endCol; col += 1) {
      rowLocators.push(new ColLocator({
        gridName,
        absCol: false,
        col,
      }))
    }

    return rowLocators
  }

  public getCellIdMatrix(): CellLocator[][] {
    const gridName = this.start.gridName
    const { startRow, startCol, endRow, endCol } = this.toSorted().getCoords()

    const matrix: CellLocator[][] = []
    for (let row = startRow; row <= endRow; row++) {
      const rowArray: CellLocator[] = []
      matrix.push(rowArray)
      for (let col = startCol; col <= endCol; col++) {
        rowArray.push(new CellLocator({
          gridName,
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
    if (this.gridName !== cellLocator.gridName) {
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
    if (this.gridName !== cellLocator.gridName) {
      return false
    }
    return cellLocator.row === this.toSorted().start.row
  }

  public isCellBottomRow(cellLocator: CellLocator): boolean {
    if (this.gridName !== cellLocator.gridName) {
      return false
    }
    return cellLocator.row === this.toSorted().end.row
  }

  public isCellIdLeftColumn(cellLocator: CellLocator): boolean {
    if (this.gridName !== cellLocator.gridName) {
      return false
    }
    return cellLocator.col === this.toSorted().start.col
  }

  public isCellIdRightColumn(cellLocator: CellLocator): boolean {
    if (this.gridName !== cellLocator.gridName) {
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
