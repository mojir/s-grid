import type { Cell } from '../Cell'
import { colLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import { getColId, getColNumber } from '../utils'
import { CellLocator } from './CellLocator'
import { CommonLocator } from './CommonLocator'
import type { Locator } from './Locator'
import { RangeLocator } from './RangeLocator'
import { RowLocator } from './RowLocator'

export function isColLocatorString(value: string): boolean {
  return colLocatorRegExp.test(value)
}

export class ColLocator extends CommonLocator implements Locator {
  public readonly absCol: boolean
  public readonly col: number

  public constructor(
    {
      grid,
      absCol,
      col,
    }: {
      grid: Grid
      absCol: boolean
      col: number
    },
  ) {
    super(grid)
    this.absCol = absCol
    this.col = col
  }

  static fromString(grid: Grid, str: string): ColLocator {
    const match = str.match(colLocatorRegExp)
    if (!match) {
      throw new Error(`Invalid col locator: ${str}`)
    }

    grid = match[1] ? grid.project.getGrid(match[1]) : grid
    const absCol = !!match[2]
    const colString = match[3]
    const col = getColNumber(colString)
    return new ColLocator({
      grid,
      absCol,
      col,
    })
  }

  static fromNumber(grid: Grid, col: number): ColLocator {
    return new ColLocator({
      grid,
      absCol: false,
      col,
    })
  }

  public override toStringWithoutGrid(): string {
    return `${this.absCol ? '$' : ''}${getColId(this.col)}`
  }

  public override equals(locator: Locator): boolean {
    return this.toRangeLocator().equals(locator)
  }

  public toRangeLocator(): RangeLocator {
    return RangeLocator.fromCellLocators(
      CellLocator.fromRowCol({
        rowLocator: RowLocator.fromNumber(this.grid, 0),
        colLocator: this,
      }),
      CellLocator.fromRowCol({
        rowLocator: RowLocator.fromNumber(this.grid, this.grid.rows.value.length - 1),
        colLocator: this,
      }),
    )
  }

  public getValue(): unknown {
    return this.toRangeLocator().getValue()
  }

  public getCells(): Cell[] {
    return this.toRangeLocator().getCells()
  }

  public toRelative(): ColLocator {
    return new ColLocator({
      grid: this.grid,
      absCol: false,
      col: this.col,
    })
  }

  public move(count: number): ColLocator {
    return new ColLocator({
      grid: this.grid,
      absCol: this.absCol,
      col: this.col + count,
    })
  }

  public getAllCellLocators(rowCount: number): CellLocator[] {
    return Array.from({ length: rowCount }, (_, row) =>
      new CellLocator({
        grid: this.grid,
        absCol: this.absCol,
        col: this.col,
        absRow: this.absCol,
        row: row,
      }))
  }
}
