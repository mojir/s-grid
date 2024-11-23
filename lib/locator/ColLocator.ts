import { CellLocator } from './CellLocator'
import { CommonLocator } from './CommonLocator'

import { colLocatorRegExp } from './utils'

export type ColRange = {
  col: number
  count: number
}

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
      externalGrid,
      absCol,
      col,
    }: {
      externalGrid: string | null
      absCol: boolean
      col: number
    },
  ) {
    super(externalGrid)
    this.absCol = absCol
    this.col = col
  }

  static fromString(str: string): ColLocator {
    const match = str.match(colLocatorRegExp)
    if (!match) {
      throw new Error(`Invalid col locator: ${str}`)
    }

    const externalGrid: string | null = match[1] ?? null
    const absCol = !!match[2]
    const colString = match[3]
    const col = getColNumber(colString)
    return new ColLocator({
      externalGrid,
      absCol,
      col,
    })
  }

  public override withExternalGrid(externalGrid: string): ColLocator {
    if (this.externalGrid === externalGrid) {
      return this
    }
    return new ColLocator({
      externalGrid,
      absCol: this.absCol,
      col: this.col,
    })
  }

  public override withoutExternalGrid(): ColLocator {
    if (!this.externalGrid) {
      return this
    }
    return new ColLocator({
      externalGrid: null,
      absCol: this.absCol,
      col: this.col,
    })
  }

  static fromNumber(col: number): ColLocator {
    return new ColLocator({
      externalGrid: null,
      absCol: false,
      col,
    })
  }

  public toString(): string {
    return `${this.externalGrid ? `${this.externalGrid}!` : ''}${this.absCol ? '$' : ''}${getColId(this.col)}`
  }

  public toLocal(): ColLocator {
    return new ColLocator({
      externalGrid: null,
      absCol: this.absCol,
      col: this.col,
    })
  }

  public toLocalNonAbsolute(): ColLocator {
    return new ColLocator({
      externalGrid: null,
      absCol: false,
      col: this.col,
    })
  }

  public getAllCellLocators(rowCount: number): CellLocator[] {
    return Array.from({ length: rowCount }, (_, row) =>
      new CellLocator({
        externalGrid: this.externalGrid,
        absCol: this.absCol,
        col: this.col,
        absRow: this.absCol,
        row: row,
      }))
  }

  public isSameCol(other: ColLocator): boolean {
    return this.externalGrid === other.externalGrid && this.col === other.col
  }
}
