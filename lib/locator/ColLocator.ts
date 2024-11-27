import { CellLocator } from './CellLocator'
import { CommonLocator } from './CommonLocator'

import { colLocatorRegExp } from './utils'

export function isColLocatorString(value: string): boolean {
  return colLocatorRegExp.test(value)
}

export function getColId(col: number): string {
  if (col < 0 || col >= 26 * 26) {
    throw new Error(`Col ${col} is out of range`)
  }
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode((col % 26) + 65) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}

export function getColNumber(colLocator: string): number {
  const match = colLocator.match(colLocatorRegExp)
  if (!match) {
    throw new Error(`Invalid col string: ${colLocator}`)
  }

  return match[3].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0)
}

export class ColLocator extends CommonLocator {
  public readonly absCol: boolean
  public readonly col: number

  public constructor(
    {
      gridName,
      absCol,
      col,
    }: {
      gridName: string
      absCol: boolean
      col: number
    },
  ) {
    super(gridName)
    this.absCol = absCol
    this.col = col
  }

  static fromString(gridName: string, str: string): ColLocator {
    const match = str.match(colLocatorRegExp)
    if (!match) {
      throw new Error(`Invalid col locator: ${str}`)
    }

    gridName = match[1] ?? gridName
    const absCol = !!match[2]
    const colString = match[3]
    const col = getColNumber(colString)
    return new ColLocator({
      gridName,
      absCol,
      col,
    })
  }

  static fromNumber(gridName: string, col: number): ColLocator {
    return new ColLocator({
      gridName,
      absCol: false,
      col,
    })
  }

  public override toString(currentGridName: string): string {
    return this.gridName === currentGridName ? this.toStringWithoutGrid() : this.toStringWithGrid()
  }

  public override toStringWithGrid(): string {
    return `${this.gridName}!${this.toStringWithoutGrid()}`
  }

  public override toStringWithoutGrid(): string {
    return `${this.absCol ? '$' : ''}${getColId(this.col)}`
  }

  public toRelative(): ColLocator {
    return new ColLocator({
      gridName: this.gridName,
      absCol: false,
      col: this.col,
    })
  }

  public move(count: number): ColLocator {
    return new ColLocator({
      gridName: this.gridName,
      absCol: this.absCol,
      col: this.col + count,
    })
  }

  public getAllCellLocators(rowCount: number): CellLocator[] {
    return Array.from({ length: rowCount }, (_, row) =>
      new CellLocator({
        gridName: this.gridName,
        absCol: this.absCol,
        col: this.col,
        absRow: this.absCol,
        row: row,
      }))
  }

  public isSameCol(other: ColLocator): boolean {
    return this.gridName === other.gridName && this.col === other.col
  }
}
