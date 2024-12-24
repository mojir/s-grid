import { colRangeLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import type { Cell } from '../Cell'
import { CellLocator } from './CellLocator'
import { RangeLocator } from './RangeLocator'
import { ColLocator } from './ColLocator'
import { CommonRangeLocator } from './CommonRangeLocator'
import type { Locator } from './Locator'
import { RowLocator } from './RowLocator'

export function isColRangeLocatorString(value: string): boolean {
  return colRangeLocatorRegExp.test(value)
}

type Coords = {
  startCol: number
  endCol: number
}

export class ColRangeLocator extends CommonRangeLocator implements Locator {
  public readonly start: ColLocator
  public readonly end: ColLocator
  public override readonly nbrOfCols: number
  public override readonly nbrOfRows = 1
  public override readonly size: ComputedRef<number>

  private constructor(start: ColLocator, end: ColLocator) {
    if (start.grid !== end.grid) {
      throw new Error(`Cannot create col range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    super(start.grid)
    if (start.col <= end.col) {
      this.start = start
      this.end = end
    }
    else {
      this.start = end
      this.end = start
    }
    this.nbrOfCols = this.end.col - this.start.col + 1
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

  public override equals(other: Locator): boolean {
    return this.toRangeLocator().equals(other)
  }

  public getValue(): unknown {
    return this.toRangeLocator().getValue()
  }

  public getCells(): Cell[] {
    return this.toRangeLocator().getCells()
  }

  public toRangeLocator(): RangeLocator {
    return RangeLocator.fromCellLocators(
      CellLocator.fromRowCol({
        rowLocator: RowLocator.fromNumber(this.grid, 0),
        colLocator: this.start,
      }),
      CellLocator.fromRowCol({
        rowLocator: RowLocator.fromNumber(this.grid, this.grid.rows.value.length - 1),
        colLocator: this.end,
      }),
    )
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
      .fromCoords(this.grid, { ...this.getCoords(), startRow: 0, endRow: rowCount - 1 })
      .getAllCellLocators()
  }

  public getAllColLocators(): ColLocator[] {
    const { startCol, endCol } = this.getCoords()
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
      .fromCoords(this.grid, { ...this.getCoords(), startRow: 0, endRow: rowCount - 1 })
      .getCellIdMatrix()
  }

  public containsCell(cellLocator: CellLocator): boolean {
    const { startCol, endCol } = this.getCoords()

    return cellLocator.col >= startCol && cellLocator.col <= endCol
  }

  public containsCol(col: number): boolean {
    const { startCol, endCol } = this.getCoords()

    return col >= startCol && col <= endCol
  }
}
