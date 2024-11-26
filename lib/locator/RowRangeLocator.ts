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
    if (start.externalGrid !== end.externalGrid) {
      throw new Error(`Cannot create row range from different grids: ${start.toString()} - ${end.toString()}`)
    }
    super(start.externalGrid)
    this.start = start
    this.end = end
  }

  static fromString(value: string): RowRangeLocator {
    const match = value.match(rowRangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid row range locator: ${value}`)
    }
    const externalGrid = match.groups.grid ? `${match.groups.grid}!` : ''
    const startString = `${externalGrid}${match.groups.start}`
    const endString = `${externalGrid}${match.groups.end}`
    return new RowRangeLocator(RowLocator.fromString(startString), RowLocator.fromString(endString))
  }

  static fromRowLocator(rowLocator: RowLocator): RowRangeLocator {
    return new RowRangeLocator(rowLocator, rowLocator)
  }

  static fromRowLocators(start: RowLocator, end: RowLocator): RowRangeLocator {
    return new RowRangeLocator(start, end)
  }

  public toString(): string {
    const externalGrid = this.start.externalGrid ? `${this.start.externalGrid}!` : ''
    return `${externalGrid}${this.start.withoutExternalGrid().toString()}-${this.end.withoutExternalGrid().toString()}`
  }

  public override withExternalGrid(externalGrid: string): RowRangeLocator {
    if (this.externalGrid === externalGrid) {
      return this
    }
    return new RowRangeLocator(new RowLocator({
      externalGrid,
      absRow: this.start.absRow,
      row: this.start.row,
    }), new RowLocator({
      externalGrid,
      absRow: this.end.absRow,
      row: this.end.row,
    }))
  }

  public override withoutExternalGrid(): RowRangeLocator {
    if (!this.externalGrid) {
      return this
    }
    return new RowRangeLocator(new RowLocator({
      externalGrid: null,
      absRow: this.start.absRow,
      row: this.start.row,
    }), new RowLocator({
      externalGrid: null,
      absRow: this.end.absRow,
      row: this.end.row,
    }))
  }

  public size(): number {
    return Math.abs((this.end.row - this.start.row + 1))
  }

  public toSorted(): RowRangeLocator {
    const start = this.start
    const end = this.end
    const externalGrid = start.externalGrid

    if (start.row <= end.row) {
      return this
    }
    else {
      return new RowRangeLocator(
        new RowLocator({
          externalGrid,
          absRow: end.absRow,
          row: end.row,
        }),
        new RowLocator({
          externalGrid,
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
      .fromCoords({ ...this.toSorted().getCoords(), startCol: 0, endCol: colCount - 1 })
      .withExternalGrid(this.externalGrid)
      .getAllCellLocators()
  }

  public getAllRowLocators(): RowLocator[] {
    const externalGrid = this.externalGrid
    const { startRow, endRow } = this.toSorted().getCoords()
    const rowLocators: RowLocator[] = []
    for (let row = startRow; row <= endRow; row += 1) {
      rowLocators.push(new RowLocator({
        externalGrid,
        absRow: false,
        row,
      }))
    }
    return rowLocators
  }

  public getCellIdMatrix(colCount: number): CellLocator[][] {
    return RangeLocator
      .fromCoords({ ...this.toSorted().getCoords(), startCol: 0, endCol: colCount - 1 })
      .withExternalGrid(this.externalGrid)
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
