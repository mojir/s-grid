import { CellLocator } from './CellLocator'
import { rangeLocatorRegExp, type Movement } from './utils'

export function isRangeLocatorString(value: string): boolean {
  return rangeLocatorRegExp.test(value)
}

type Coords = {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export class RangeLocator {
  public readonly start: CellLocator
  public readonly end: CellLocator

  private constructor(start: CellLocator, end: CellLocator) {
    if (start.externalGrid !== end.externalGrid) {
      throw new Error(`Cannot create cell range from different grids: ${start.toString()} - ${end.toString()}`)
    }
    this.start = start
    this.end = end
  }

  static fromString(value: string): RangeLocator {
    const match = value.match(rangeLocatorRegExp)
    if (!match?.groups) {
      throw new Error(`Invalid cell range locator: ${value}`)
    }
    const externalGrid = match.groups.grid ? `${match.groups.grid}!` : ''
    const startString = `${externalGrid}${match.groups.start}`
    const endString = `${externalGrid}${match.groups.end}`
    return new RangeLocator(CellLocator.fromString(startString), CellLocator.fromString(endString))
  }

  static fromCellLocator(cellLocator: CellLocator): RangeLocator {
    return new RangeLocator(cellLocator, cellLocator)
  }

  static fromCellLocators(start: CellLocator, end: CellLocator): RangeLocator {
    return new RangeLocator(start, end)
  }

  static fromCoords(coords: Coords): RangeLocator {
    const { startRow, startCol, endRow, endCol } = coords
    return new RangeLocator(
      new CellLocator({ row: startRow, col: startCol, absRow: false, absCol: false, externalGrid: null }),
      new CellLocator({ row: endRow, col: endCol, absRow: false, absCol: false, externalGrid: null }),
    )
  }

  public toString(): string {
    const externalGrid = this.start.externalGrid ? `${this.start.externalGrid}!` : ''
    return `${externalGrid}${this.start.toLocal().toString()}-${this.end.toLocal().toString()}`
  }

  public getExternalGrid(): string | null {
    return this.start.externalGrid
  }

  public size(): number {
    return (this.end.row - this.start.row + 1) * (this.end.col - this.start.col + 1)
  }

  public toSorted(): RangeLocator {
    const start = this.start
    const end = this.end
    const externalGrid = start.externalGrid

    if (start.row <= end.row && start.col <= end.col) {
      return this
    }
    else if (start.col <= end.col && start.row > end.row) {
      return new RangeLocator(
        new CellLocator({
          externalGrid,
          absCol: start.absCol,
          col: start.col,
          absRow: end.absRow,
          row: end.row,
        }),
        new CellLocator({
          externalGrid,
          absCol: end.absCol,
          col: end.col,
          absRow: start.absRow,
          row: start.row,
        }),
      )
    }
    else if (start.col > end.col && start.row <= end.row) {
      return new RangeLocator(
        new CellLocator({
          externalGrid,
          absCol: end.absCol,
          col: end.col,
          absRow: start.absRow,
          row: start.row,
        }),
        new CellLocator({
          externalGrid,
          absCol: start.absCol,
          col: start.col,
          absRow: end.absRow,
          row: end.row,
        }),
      )
    }
    else {
      return new RangeLocator(
        new CellLocator({
          externalGrid,
          absCol: end.absCol,
          col: end.col,
          absRow: end.absRow,
          row: end.row,
        }),
        new CellLocator({
          externalGrid,
          absCol: start.absCol,
          col: start.col,
          absRow: start.absRow,
          row: start.row,
        }),
      )
    }
  }

  public getCoords(): Coords {
    const {
      start: { row: startRow, col: startCol },
      end: { row: endRow, col: endCol },
    } = this.toSorted()
    return { startRow, startCol, endRow, endCol }
  }

  public clamp(range: RangeLocator): RangeLocator {
    if (this.getExternalGrid() !== range.getExternalGrid()) {
      throw new Error(`Cannot clamp cell range from different grids: ${this.toString()} and ${range.toString()}`)
    }
    const sorted = this.toSorted()
    const clampedStart = sorted.start.clamp(range)
    const clampedEnd = sorted.end.clamp(range)

    return RangeLocator.fromCellLocators(clampedStart, clampedEnd)
  }

  public getAllCellLocators(): CellLocator[] {
    const cellIds: CellLocator[] = []
    const externalGrid = this.start.externalGrid

    const { startRow, startCol, endRow, endCol } = this.toSorted().getCoords()

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        cellIds.push(new CellLocator({
          externalGrid,
          absCol: false,
          col,
          absRow: false,
          row,
        }))
      }
    }

    return cellIds
  }

  public getCellIdMatrix(): CellLocator[][] {
    const externalGrid = this.start.externalGrid
    const { startRow, startCol, endRow, endCol } = this.toSorted().getCoords()

    const matrix: CellLocator[][] = []
    for (let row = startRow; row <= endRow; row++) {
      const rowArray: CellLocator[] = []
      matrix.push(rowArray)
      for (let col = startCol; col <= endCol; col++) {
        rowArray.push(new CellLocator({
          externalGrid,
          absCol: false,
          col,
          absRow: false,
          row,
        }))
      }
    }
    return matrix
  }

  public containsCell(cellLocator: CellLocator): boolean {
    if (this.getExternalGrid() !== cellLocator.externalGrid) {
      return false
    }
    const sorted = this.toSorted()
    return cellLocator.row >= sorted.start.row
      && cellLocator.row <= sorted.end.row
      && cellLocator.col >= sorted.start.col
      && cellLocator.col <= sorted.end.col
  }

  public containsRow(row: number): boolean {
    const sorted = this.toSorted()
    return row >= sorted.start.row && row <= sorted.end.row
  }

  public containsCol(col: number): boolean {
    const sorted = this.toSorted()
    return col >= sorted.start.col && col <= sorted.end.col
  }

  public isCellInTopRow(cellLocator: CellLocator): boolean {
    if (this.getExternalGrid() !== cellLocator.externalGrid) {
      return false
    }
    return cellLocator.row === this.toSorted().start.row
  }

  public isCellBottomRow(cellLocator: CellLocator): boolean {
    if (this.getExternalGrid() !== cellLocator.externalGrid) {
      return false
    }
    return cellLocator.row === this.toSorted().end.row
  }

  public isCellIdLeftColumn(cellLocator: CellLocator): boolean {
    if (this.getExternalGrid() !== cellLocator.externalGrid) {
      return false
    }
    return cellLocator.col === this.toSorted().start.col
  }

  public isCellIdRightColumn(cellLocator: CellLocator): boolean {
    if (this.getExternalGrid() !== cellLocator.externalGrid) {
      return false
    }
    return cellLocator.col === this.toSorted().end.col
  }

  public equals(other: RangeLocator): boolean {
    const sorted = this.toSorted()
    const otherSorted = other.toSorted()
    return sorted.start.isSameCell(otherSorted.start) && sorted.end.isSameCell(otherSorted.end)
  }

  public move(movement: Movement): RangeLocator {
    return RangeLocator.fromCellLocators(this.start.move(movement), this.end.move(movement))
  }
}
