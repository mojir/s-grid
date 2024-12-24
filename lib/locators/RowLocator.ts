import type { Cell } from '../Cell'
import { rowLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import { getRowId, getRowNumber } from '../utils'
import { CellLocator } from './CellLocator'
import { ColLocator } from './ColLocator'
import { CommonLocator } from './CommonLocator'
import type { Locator } from './Locator'
import { RangeLocator } from './RangeLocator'

export function isRowLocatorString(value: string): boolean {
  return rowLocatorRegExp.test(value)
}

export class RowLocator extends CommonLocator implements Locator {
  public readonly absRow: boolean
  public readonly row: number

  public constructor(
    {
      grid,
      absRow,
      row,
    }: {
      grid: Grid
      absRow: boolean
      row: number
    },
  ) {
    super(grid)
    this.absRow = absRow
    this.row = row
  }

  static fromString(grid: Grid, str: string): RowLocator {
    const match = str.match(rowLocatorRegExp)
    if (!match) {
      throw new Error(`Invalid row locator: ${str}`)
    }

    grid = match[1] ? grid.project.getGrid(match[1]) : grid
    const absRow = !!match[2]
    const rowString = match[3]
    const row = getRowNumber(rowString)
    return new RowLocator({
      grid,
      absRow,
      row,
    })
  }

  static fromNumber(grid: Grid, row: number): RowLocator {
    return new RowLocator({
      grid,
      absRow: false,
      row,
    })
  }

  public override toStringWithoutGrid(): string {
    return `${this.absRow ? '$' : ''}${getRowId(this.row)}`
  }

  public getValue(): unknown {
    return this.toRangeLocator().getValue()
  }

  public getCells(): Cell[] {
    return this.toRangeLocator().getCells()
  }

  public override equals(other: Locator): boolean {
    return this.toRangeLocator().equals(other)
  }

  public toRangeLocator(): RangeLocator {
    return RangeLocator.fromCellLocators(
      CellLocator.fromRowCol({
        rowLocator: this,
        colLocator: ColLocator.fromNumber(this.grid, 0),
      }),
      CellLocator.fromRowCol({
        rowLocator: this,
        colLocator: ColLocator.fromNumber(this.grid, this.grid.cols.value.length - 1),
      }),
    )
  }

  public toRelative(): RowLocator {
    return new RowLocator({
      grid: this.grid,
      absRow: false,
      row: this.row,
    })
  }

  public move(count: number): RowLocator {
    return new RowLocator({
      grid: this.grid,
      absRow: this.absRow,
      row: this.row + count,
    })
  }

  public getAllCellLocators(colCount: number): CellLocator[] {
    return Array.from({ length: colCount }, (_, col) =>
      new CellLocator({
        grid: this.grid,
        absCol: this.absRow,
        col,
        absRow: this.absRow,
        row: this.row,
      }))
  }
}
