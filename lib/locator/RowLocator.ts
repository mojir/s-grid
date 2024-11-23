import { CellLocator } from './CellLocator'
import { CommonLocator } from './CommonLocator'

import { rowLocatorRegExp } from './utils'

export type RowRange = {
  row: number
  count: number
}

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
      externalGrid,
      absRow,
      row,
    }: {
      externalGrid: string | null
      absRow: boolean
      row: number
    },
  ) {
    super(externalGrid)
    this.absRow = absRow
    this.row = row
  }

  static fromString(str: string): RowLocator {
    const match = str.match(rowLocatorRegExp)
    if (!match) {
      throw new Error(`Invalid row locator: ${str}`)
    }

    const externalGrid: string | null = match[1] ?? null
    const absRow = !!match[2]
    const rowString = match[3]
    const row = getRowNumber(rowString)
    return new RowLocator({
      externalGrid,
      absRow,
      row,
    })
  }

  static fromNumber(row: number): RowLocator {
    return new RowLocator({
      externalGrid: null,
      absRow: false,
      row,
    })
  }

  public toString(): string {
    return `${this.externalGrid ? `${this.externalGrid}!` : ''}${this.absRow ? '$' : ''}${getRowId(this.row)}`
  }

  public override withExternalGrid(externalGrid: string): RowLocator {
    if (this.externalGrid === externalGrid) {
      return this
    }
    return new RowLocator({
      externalGrid,
      absRow: this.absRow,
      row: this.row,
    })
  }

  public override withoutExternalGrid(): RowLocator {
    if (!this.externalGrid) {
      return this
    }
    return new RowLocator({
      externalGrid: null,
      absRow: this.absRow,
      row: this.row,
    })
  }

  public toLocal(): RowLocator {
    return new RowLocator({
      externalGrid: null,
      absRow: this.absRow,
      row: this.row,
    })
  }

  public toLocalNonAbsolute(): RowLocator {
    return new RowLocator({
      externalGrid: null,
      absRow: false,
      row: this.row,
    })
  }

  public getAllCellLocators(colCount: number): CellLocator[] {
    return Array.from({ length: colCount }, (_, col) =>
      new CellLocator({
        externalGrid: this.externalGrid,
        absCol: this.absRow,
        col,
        absRow: this.absRow,
        row: this.row,
      }))
  }

  public isSameRow(other: RowLocator): boolean {
    return this.externalGrid === other.externalGrid && this.row === other.row
  }
}
