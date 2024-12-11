import { colLocatorRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import { getColId, getColNumber } from '../utils'
import { CellLocator } from './CellLocator'
import { CommonLocator } from './CommonLocator'

export function isColLocatorString(value: string): boolean {
  return colLocatorRegExp.test(value)
}

export class ColLocator extends CommonLocator {
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

  public isSameCol(other: ColLocator): boolean {
    return this.grid === other.grid && this.col === other.col
  }
}
