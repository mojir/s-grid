import type { Cell } from '../Cell'
import { rowRangeLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import { CellLocator } from './CellLocator'
import { ColLocator } from './ColLocator'
import { CommonRangeLocator } from './CommonRangeLocator'
import type { Locator } from './Locator'
import { RangeLocator } from './RangeLocator'
import { RowLocator } from './RowLocator'

export function isRowRangeLocatorString(value: string): boolean {
  return rowRangeLocatorRegExp.test(value)
}

type Coords = {
  startRow: number
  endRow: number
}

export class RowRangeLocator extends CommonRangeLocator implements Locator {
  public readonly start: RowLocator
  public readonly end: RowLocator
  public override readonly nbrOfRows: number
  public override readonly nbrOfCols = 1
  public override readonly size: ComputedRef<number>

  private constructor(start: RowLocator, end: RowLocator) {
    if (start.grid !== end.grid) {
      throw new Error(`Cannot create row range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    super(start.grid)
    if (start.row <= end.row) {
      this.start = start
      this.end = end
    }
    else {
      this.start = end
      this.end = start
    }
    this.nbrOfRows = Math.abs((this.end.row - this.start.row + 1))
    this.size = computed(() => this.nbrOfRows * this.grid.rows.value.length)
  }

  static fromString(grid: Grid, value: string): RowRangeLocator {
    const match = value.match(rowRangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid row range locator: ${value}`)
    }
    grid = match.groups.grid ? grid.project.getGrid(match.groups.grid) : grid
    const startString = `${grid.name.value}!${match.groups.start}`
    const endString = `${grid.name.value}!${match.groups.end}`
    return new RowRangeLocator(RowLocator.fromString(grid, startString), RowLocator.fromString(grid, endString))
  }

  static fromRowLocator(rowLocator: RowLocator): RowRangeLocator {
    return new RowRangeLocator(rowLocator, rowLocator)
  }

  static fromRowLocators(start: RowLocator, end: RowLocator): RowRangeLocator {
    return new RowRangeLocator(start, end)
  }

  public getValue(): unknown {
    return this.toRangeLocator().getValue()
  }

  public getCells(): Cell[] {
    return this.toRangeLocator().getCells()
  }

  public override toStringWithoutGrid(): string {
    return `${this.start.toStringWithoutGrid()}-${this.end.toStringWithoutGrid()}`
  }

  public override equals(other: Locator): boolean {
    return this.toRangeLocator().equals(other)
  }

  public toRangeLocator(): RangeLocator {
    return RangeLocator.fromCellLocators(
      CellLocator.fromRowCol({
        rowLocator: this.start,
        colLocator: ColLocator.fromNumber(this.grid, 0),
      }),
      CellLocator.fromRowCol({
        rowLocator: this.end,
        colLocator: ColLocator.fromNumber(this.grid, this.grid.cols.value.length - 1),
      }),
    )
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
      .fromCoords(this.grid, { ...this.getCoords(), startCol: 0, endCol: colCount - 1 })
      .getAllCellLocators()
  }

  public getAllRowLocators(): RowLocator[] {
    const { startRow, endRow } = this.getCoords()
    const rowLocators: RowLocator[] = []
    for (let row = startRow; row <= endRow; row += 1) {
      rowLocators.push(new RowLocator({
        grid: this.grid,
        absRow: false,
        row,
      }))
    }
    return rowLocators
  }

  public getCellIdMatrix(colCount: number): CellLocator[][] {
    return RangeLocator
      .fromCoords(this.grid, { ...this.getCoords(), startCol: 0, endCol: colCount - 1 })
      .getCellIdMatrix()
  }

  public containsCell(cellLocator: CellLocator): boolean {
    const { startRow, endRow } = this.getCoords()

    return cellLocator.row >= startRow && cellLocator.row <= endRow
  }

  public containsRow(row: number): boolean {
    const { startRow, endRow } = this.getCoords()

    return row >= startRow && row <= endRow
  }
}
