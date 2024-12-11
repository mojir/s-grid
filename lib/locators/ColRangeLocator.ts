import { colRangeLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
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
    if (start.grid !== end.grid) {
      throw new Error(`Cannot create col range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    super(start.grid)
    this.start = start
    this.end = end
  }

  static fromString(grid: Grid, value: string): ColRangeLocator {
    const match = value.match(colRangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid col range locator: ${value}`)
    }
    grid = match.groups.grid ? grid.project.getGrid(match.groups.grid) : grid
    const startString = `${grid.name.value}!${match.groups.start}`
    const endString = `${grid.name.value}!${match.groups.end}`
    return new ColRangeLocator(ColLocator.fromString(grid, startString), ColLocator.fromString(grid, endString))
  }

  static fromColLocator(rowLocator: ColLocator): ColRangeLocator {
    return new ColRangeLocator(rowLocator, rowLocator)
  }

  static fromColLocators(start: ColLocator, end: ColLocator): ColRangeLocator {
    return new ColRangeLocator(start, end)
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

    if (start.col <= end.col) {
      return this
    }
    else {
      return new ColRangeLocator(
        new ColLocator({
          grid: this.grid,
          absCol: end.absCol,
          col: end.col,
        }),
        new ColLocator({
          grid: this.grid,
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
      .fromCoords(this.grid, { ...this.toSorted().getCoords(), startRow: 0, endRow: rowCount - 1 })
      .getAllCellLocators()
  }

  public getAllColLocators(): ColLocator[] {
    const { startCol, endCol } = this.toSorted().getCoords()
    const colLocators: ColLocator[] = []
    for (let col = startCol; col <= endCol; col += 1) {
      colLocators.push(new ColLocator({
        grid: this.grid,
        absCol: false,
        col,
      }))
    }
    return colLocators
  }

  public getCellIdMatrix(rowCount: number): CellLocator[][] {
    return RangeLocator
      .fromCoords(this.grid, { ...this.toSorted().getCoords(), startRow: 0, endRow: rowCount - 1 })
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
