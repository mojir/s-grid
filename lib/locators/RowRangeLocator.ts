import { rowRangeLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import type { CellLocator } from './CellLocator'
import { CommonRangeLocator } from './CommonRangeLocator'
import { RangeLocator } from './RangeLocator'
import { RowLocator } from './RowLocator'

export function isRowRangeLocatorString(value: string): boolean {
  return rowRangeLocatorRegExp.test(value)
}

type Coords = {
  startRow: number
  endRow: number
}

export class RowRangeLocator extends CommonRangeLocator {
  public readonly start: RowLocator
  public readonly end: RowLocator
  public override readonly nbrOfRows: number
  public override readonly nbrOfCols = 1
  public override readonly size: ComputedRef<number>

  private constructor(start: RowLocator, end: RowLocator) {
    if (start.grid !== end.grid) {
      throw new Error(`Cannot create row range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }
    super(start.grid, start.row <= end.row)
    this.start = start
    this.end = end
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

  public override toStringWithoutGrid(): string {
    return `${this.start.toStringWithoutGrid()}-${this.end.toStringWithoutGrid()}`
  }

  public override equals(other: RowRangeLocator): boolean {
    const sorted = this.toSorted()
    const otherSorted = other.toSorted()
    return sorted.start.equals(otherSorted.start) && sorted.end.equals(otherSorted.end)
  }

  public override toSorted(): RowRangeLocator {
    if (this.sorted) {
      return this
    }
    else {
      return new RowRangeLocator(
        this.end,
        this.start,
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
      .fromCoords(this.grid, { ...this.toSorted().getCoords(), startCol: 0, endCol: colCount - 1 })
      .getAllCellLocators()
  }

  public getAllRowLocators(): RowLocator[] {
    const { startRow, endRow } = this.toSorted().getCoords()
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
      .fromCoords(this.grid, { ...this.toSorted().getCoords(), startCol: 0, endCol: colCount - 1 })
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
}
