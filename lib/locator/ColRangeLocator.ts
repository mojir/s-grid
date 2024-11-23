import type { CellLocator } from './CellLocator'
import { RangeLocator } from './RangeLocator'
import { ColLocator } from './ColLocator'
import { colRangeLocatorRegExp } from './utils'

export function isColRangeLocatorString(value: string): boolean {
  return colRangeLocatorRegExp.test(value)
}

type Coords = {
  startCol: number
  endCol: number
}

export class ColRangeLocator {
  public readonly start: ColLocator
  public readonly end: ColLocator

  private constructor(start: ColLocator, end: ColLocator) {
    if (start.externalGrid !== end.externalGrid) {
      throw new Error(`Cannot create col range from different grids: ${start.toString()} - ${end.toString()}`)
    }
    this.start = start
    this.end = end
  }

  static fromString(value: string): ColRangeLocator {
    const match = value.match(colRangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid col range locator: ${value}`)
    }
    const externalGrid = match.groups.grid ? `${match.groups.grid}!` : ''
    const startString = `${externalGrid}${match.groups.start}`
    const endString = `${externalGrid}${match.groups.end}`
    return new ColRangeLocator(ColLocator.fromString(startString), ColLocator.fromString(endString))
  }

  static fromRowLocator(rowLocator: ColLocator): ColRangeLocator {
    return new ColRangeLocator(rowLocator, rowLocator)
  }

  static fromCellLocators(start: ColLocator, end: ColLocator): ColRangeLocator {
    return new ColRangeLocator(start, end)
  }

  public toString(): string {
    const externalGrid = this.start.externalGrid ? `${this.start.externalGrid}!` : ''
    return `${externalGrid}${this.start.toLocal().toString()}-${this.end.toLocal().toString()}`
  }

  public getExternalGrid(): string | null {
    return this.start.externalGrid
  }

  public size(): number {
    return Math.abs((this.end.col - this.start.col + 1))
  }

  public toSorted(): ColRangeLocator {
    const start = this.start
    const end = this.end
    const externalGrid = start.externalGrid

    if (start.col <= end.col) {
      return this
    }
    else {
      return new ColRangeLocator(
        new ColLocator({
          externalGrid,
          absCol: end.absCol,
          col: end.col,
        }),
        new ColLocator({
          externalGrid,
          absCol: start.absCol,
          col: start.col,
        }),
      )
    }
  }

  public getCoords(): Coords {
    return {
      startCol: this.start.col,
      endCol: this.end.col,
    }
  }

  public getAllCellLocators(rowCount: number): CellLocator[] {
    return RangeLocator
      .fromCoords({ ...this.toSorted().getCoords(), startRow: 0, endRow: rowCount - 1 })
      .withExternalGrid(this.getExternalGrid())
      .getAllCellLocators()
  }

  public getAllColLocators(): ColLocator[] {
    const externalGrid = this.getExternalGrid()
    const { startCol, endCol } = this.toSorted().getCoords()
    const colLocators: ColLocator[] = []
    for (let col = startCol; col <= endCol; col += 1) {
      colLocators.push(new ColLocator({
        externalGrid,
        absCol: false,
        col,
      }))
    }
    return colLocators
  }

  public getCellIdMatrix(rowCount: number): CellLocator[][] {
    return RangeLocator
      .fromCoords({ ...this.toSorted().getCoords(), startRow: 0, endRow: rowCount - 1 })
      .withExternalGrid(this.getExternalGrid())
      .getCellIdMatrix()
  }

  public containsCell(cellLocator: CellLocator): boolean {
    const { startCol, endCol } = this.toSorted().getCoords()

    return cellLocator.col >= startCol && cellLocator.col <= endCol
  }

  public containsCol(col: number): boolean {
    const { startCol, endCol } = this.toSorted().getCoords()

    return col >= startCol && col <= endCol
  }

  public equals(other: ColRangeLocator): boolean {
    const sorted = this.toSorted()
    const otherSorted = other.toSorted()
    return sorted.start.isSameCol(otherSorted.start) && sorted.end.isSameCol(otherSorted.end)
  }
}
