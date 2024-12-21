import { colRangeLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import type { CellLocator } from './CellLocator'
import { RangeLocator } from './RangeLocator'
import { ColLocator } from './ColLocator'
import { CommonRangeLocator } from './CommonRangeLocator'

export function isColRangeLocatorString(value: string): boolean {
  return colRangeLocatorRegExp.test(value)
}

type Coords = {
  startCol: number
  endCol: number
}

export class ColRangeLocator extends CommonRangeLocator {
  public readonly start: ColLocator
  public readonly end: ColLocator
  public override readonly nbrOfCols: number
  public override readonly nbrOfRows = 1
  public override readonly size: ComputedRef<number>

  private constructor(start: ColLocator, end: ColLocator) {
    if (start.grid !== end.grid) {
      throw new Error(`Cannot create col range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    super(start.grid, start.col <= end.col)
    this.start = start
    this.end = end
    this.nbrOfCols = Math.abs((this.end.col - this.start.col + 1))
    this.size = computed(() => this.nbrOfCols * this.grid.rows.value.length)
  }

  static fromString(grid: Grid, value: string): ColRangeLocator {
    const match = value.match(colRangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid col range locator: ${value}`)
    }
    grid = match.groups.grid ? grid.project.getGrid(match.groups.grid) : grid
    const start = ColLocator.fromString(grid, `${grid.name.value}!${match.groups.start}`)
    const end = ColLocator.fromString(grid, `${grid.name.value}!${match.groups.end}`)
    return new ColRangeLocator(start, end)
  }

  static fromColLocator(colLocator: ColLocator): ColRangeLocator {
    return new ColRangeLocator(colLocator, colLocator)
  }

  static fromColLocators(start: ColLocator, end: ColLocator): ColRangeLocator {
    return new ColRangeLocator(start, end)
  }

  public override toStringWithoutGrid(): string {
    return `${this.start.toStringWithoutGrid()}-${this.end.toStringWithoutGrid()}`
  }

  public override equals(other: ColRangeLocator): boolean {
    const sorted = this.toSorted()
    const otherSorted = other.toSorted()
    return sorted.start.equals(otherSorted.start) && sorted.end.equals(otherSorted.end)
  }

  public override toSorted(): ColRangeLocator {
    if (this.sorted) {
      return this
    }
    else {
      return new ColRangeLocator(
        this.end,
        this.start,
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
}
