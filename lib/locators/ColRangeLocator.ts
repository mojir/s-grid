import { colRangeLocatorRegExp } from '../constants'
import type { CellLocator } from './CellLocator'
import { RangeLocator } from './RangeLocator'
import { ColLocator } from './ColLocator'
import { CommonLocator } from './CommonLocator'

export function isColRangeLocatorString(value: string): boolean {
  return colRangeLocatorRegExp.test(value)
}

type Coords = {
  startCol: number
  endCol: number
}

export class ColRangeLocator extends CommonLocator {
  public readonly start: ColLocator
  public readonly end: ColLocator

  private constructor(start: ColLocator, end: ColLocator) {
    if (start.gridName !== end.gridName) {
      throw new Error(`Cannot create col range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    super(start.gridName)
    this.start = start
    this.end = end
  }

  static fromString(gridName: string, value: string): ColRangeLocator {
    const match = value.match(colRangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid col range locator: ${value}`)
    }
    gridName = match.groups.grid ?? gridName
    const startString = `${gridName}!${match.groups.start}`
    const endString = `${gridName}!${match.groups.end}`
    return new ColRangeLocator(ColLocator.fromString(gridName, startString), ColLocator.fromString(gridName, endString))
  }

  static fromColLocator(rowLocator: ColLocator): ColRangeLocator {
    return new ColRangeLocator(rowLocator, rowLocator)
  }

  static fromColLocators(start: ColLocator, end: ColLocator): ColRangeLocator {
    return new ColRangeLocator(start, end)
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
    return Math.abs((this.end.col - this.start.col + 1))
  }

  public toSorted(): ColRangeLocator {
    const start = this.start
    const end = this.end
    const gridName = start.gridName

    if (start.col <= end.col) {
      return this
    }
    else {
      return new ColRangeLocator(
        new ColLocator({
          gridName,
          absCol: end.absCol,
          col: end.col,
        }),
        new ColLocator({
          gridName,
          absCol: start.absCol,
          col: start.col,
        }),
      )
    }
  }

  public move(count: number): ColRangeLocator {
    return new ColRangeLocator(
      this.start.move(count),
      this.end.move(count),
    )
  }

  public getCoords(): Coords {
    return {
      startCol: this.start.col,
      endCol: this.end.col,
    }
  }

  public getAllCellLocators(rowCount: number): CellLocator[] {
    return RangeLocator
      .fromCoords(this.gridName, { ...this.toSorted().getCoords(), startRow: 0, endRow: rowCount - 1 })
      .getAllCellLocators()
  }

  public getAllColLocators(): ColLocator[] {
    const gridName = this.gridName
    const { startCol, endCol } = this.toSorted().getCoords()
    const colLocators: ColLocator[] = []
    for (let col = startCol; col <= endCol; col += 1) {
      colLocators.push(new ColLocator({
        gridName,
        absCol: false,
        col,
      }))
    }
    return colLocators
  }

  public getCellIdMatrix(rowCount: number): CellLocator[][] {
    return RangeLocator
      .fromCoords(this.gridName, { ...this.toSorted().getCoords(), startRow: 0, endRow: rowCount - 1 })
      .getCellIdMatrix()
  }

  public containsCell(cellLocator: CellLocator): boolean {
    const { startCol, endCol } = this.toSorted().getCoords()

    return cellLocator.col >= startCol && cellLocator.col <= endCol
  }

  public containsCol(col: number): boolean {
    const { startCol, endCol } = this.toSorted().getCoords()

    return col >= startCol && col <= endCol
  }

  public equals(other: ColRangeLocator): boolean {
    const sorted = this.toSorted()
    const otherSorted = other.toSorted()
    return sorted.start.isSameCol(otherSorted.start) && sorted.end.isSameCol(otherSorted.end)
  }
}
