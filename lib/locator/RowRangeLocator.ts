import type { CellLocator } from './CellLocator'
import { CommonLocator } from './CommonLocator'

import { RangeLocator } from './RangeLocator'
import { RowLocator } from './RowLocator'
import { rowRangeLocatorRegExp } from './utils'

export function isRowRangeLocatorString(value: string): boolean {
  return rowRangeLocatorRegExp.test(value)
}

type Coords = {
  startRow: number
  endRow: number
}

export class RowRangeLocator extends CommonLocator {
  public readonly start: RowLocator
  public readonly end: RowLocator

  private constructor(start: RowLocator, end: RowLocator) {
    if (start.gridName !== end.gridName) {
      throw new Error(`Cannot create row range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    super(start.gridName)
    this.start = start
    this.end = end
  }

  static fromString(gridName: string, value: string): RowRangeLocator {
    const match = value.match(rowRangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid row range locator: ${value}`)
    }
    gridName = match.groups.grid ?? gridName
    const startString = `${gridName}!${match.groups.start}`
    const endString = `${gridName}!${match.groups.end}`
    return new RowRangeLocator(RowLocator.fromString(gridName, startString), RowLocator.fromString(gridName, endString))
  }

  static fromRowLocator(rowLocator: RowLocator): RowRangeLocator {
    return new RowRangeLocator(rowLocator, rowLocator)
  }

  static fromRowLocators(start: RowLocator, end: RowLocator): RowRangeLocator {
    return new RowRangeLocator(start, end)
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
    return Math.abs((this.end.row - this.start.row + 1))
  }

  public toSorted(): RowRangeLocator {
    const start = this.start
    const end = this.end
    const gridName = start.gridName

    if (start.row <= end.row) {
      return this
    }
    else {
      return new RowRangeLocator(
        new RowLocator({
          gridName,
          absRow: end.absRow,
          row: end.row,
        }),
        new RowLocator({
          gridName,
          absRow: start.absRow,
          row: start.row,
        }),
      )
    }
  }

  public move(count: number): RowRangeLocator {
    return new RowRangeLocator(
      this.start.move(count),
      this.end.move(count),
    )
  }

  public getCoords(): Coords {
    return {
      startRow: this.start.row,
      endRow: this.end.row,
    }
  }

  public getAllCellLocators(colCount: number): CellLocator[] {
    return RangeLocator
      .fromCoords(this.gridName, { ...this.toSorted().getCoords(), startCol: 0, endCol: colCount - 1 })
      .getAllCellLocators()
  }

  public getAllRowLocators(): RowLocator[] {
    const gridName = this.gridName
    const { startRow, endRow } = this.toSorted().getCoords()
    const rowLocators: RowLocator[] = []
    for (let row = startRow; row <= endRow; row += 1) {
      rowLocators.push(new RowLocator({
        gridName,
        absRow: false,
        row,
      }))
    }
    return rowLocators
  }

  public getCellIdMatrix(colCount: number): CellLocator[][] {
    return RangeLocator
      .fromCoords(this.gridName, { ...this.toSorted().getCoords(), startCol: 0, endCol: colCount - 1 })
      .getCellIdMatrix()
  }

  public containsCell(cellLocator: CellLocator): boolean {
    const { startRow, endRow } = this.toSorted().getCoords()

    return cellLocator.row >= startRow && cellLocator.row <= endRow
  }

  public containsRow(row: number): boolean {
    const { startRow, endRow } = this.toSorted().getCoords()

    return row >= startRow && row <= endRow
  }

  public equals(other: RowRangeLocator): boolean {
    const sorted = this.toSorted()
    const otherSorted = other.toSorted()
    return sorted.start.isSameRow(otherSorted.start) && sorted.end.isSameRow(otherSorted.end)
  }
}
