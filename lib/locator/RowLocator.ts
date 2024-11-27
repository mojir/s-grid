import { CellLocator } from './CellLocator'
import { CommonLocator } from './CommonLocator'

import { rowLocatorRegExp } from './utils'

export function isRowLocatorString(value: string): boolean {
  return rowLocatorRegExp.test(value)
}

export function getRowId(rowIndex: number): string {
  if (rowIndex < 9999 && rowIndex >= 0) {
    return `${rowIndex + 1}` as string
  }
  throw new Error(`Row index ${rowIndex} is out of range`)
}

export function getRowNumber(rowLocator: string): number {
  const match = rowLocator.match(rowLocatorRegExp)
  if (!match) {
    throw new Error(`Invalid row string: ${rowLocator}`)
  }
  return Number(match[3]) - 1
}

export class RowLocator extends CommonLocator {
  public readonly absRow: boolean
  public readonly row: number

  public constructor(
    {
      gridName,
      absRow,
      row,
    }: {
      gridName: string
      absRow: boolean
      row: number
    },
  ) {
    super(gridName)
    this.absRow = absRow
    this.row = row
  }

  static fromString(gridName: string, str: string): RowLocator {
    const match = str.match(rowLocatorRegExp)
    if (!match) {
      throw new Error(`Invalid row locator: ${str}`)
    }

    gridName = match[1] ?? gridName
    const absRow = !!match[2]
    const rowString = match[3]
    const row = getRowNumber(rowString)
    return new RowLocator({
      gridName,
      absRow,
      row,
    })
  }

  static fromNumber(gridName: string, row: number): RowLocator {
    return new RowLocator({
      gridName,
      absRow: false,
      row,
    })
  }

  public override toString(currentGridName: string): string {
    return this.gridName === currentGridName ? this.toStringWithoutGrid() : this.toStringWithGrid()
  }

  public override toStringWithGrid(): string {
    return `${this.gridName}!${this.toStringWithoutGrid()}`
  }

  public override toStringWithoutGrid(): string {
    return `${this.absRow ? '$' : ''}${getRowId(this.row)}`
  }

  public toRelative(): RowLocator {
    return new RowLocator({
      gridName: this.gridName,
      absRow: false,
      row: this.row,
    })
  }

  public move(count: number): RowLocator {
    return new RowLocator({
      gridName: this.gridName,
      absRow: this.absRow,
      row: this.row + count,
    })
  }

  public getAllCellLocators(colCount: number): CellLocator[] {
    return Array.from({ length: colCount }, (_, col) =>
      new CellLocator({
        gridName: this.gridName,
        absCol: this.absRow,
        col,
        absRow: this.absRow,
        row: this.row,
      }))
  }

  public isSameRow(other: RowLocator): boolean {
    return this.gridName === other.gridName && this.row === other.row
  }
}
