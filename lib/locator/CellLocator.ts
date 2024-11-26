import type { RangeLocator } from './RangeLocator'
import { ColLocator, getColNumber, getColId } from './ColLocator'
import { getRowNumber, getRowId, RowLocator } from './RowLocator'
import { cellLocatorRegExp, type Direction, type Movement } from './utils'
import { CommonLocator } from './CommonLocator'

export function isCellLocatorString(id: string): boolean {
  return cellLocatorRegExp.test(id)
}

export class CellLocator extends CommonLocator {
  public readonly absCol: boolean
  public readonly col: number
  public readonly absRow: boolean
  public readonly row: number

  public constructor(
    {
      externalGrid,
      absCol,
      col,
      absRow,
      row,
    }: { externalGrid: string | null
      absCol: boolean
      col: number
      absRow: boolean
      row: number
    },
  ) {
    if (col < 0) {
      throw new Error(`Col ${col} is out of range`)
    }
    if (row < 0) {
      throw new Error(`Row ${row} is out of range`)
    }
    if (col > 26 * 26) {
      throw new Error(`Col ${col} is out of range`)
    }
    if (row > 9999) {
      throw new Error(`Row ${row} is out of range`)
    }

    super(externalGrid)
    this.absCol = absCol
    this.col = col
    this.absRow = absRow
    this.row = row
  }

  static fromString(str: string): CellLocator {
    const match = str.match(cellLocatorRegExp)
    if (!match) {
      throw new Error(`Invalid cell locator: ${str}`)
    }

    const externalGrid: string | null = match[1] ?? null
    const absCol = !!match[2]
    const colId = match[3]
    const col = getColNumber(colId)
    const absRow = !!match[4]
    const rowId = match[5]
    const row = getRowNumber(rowId)
    return new CellLocator({
      externalGrid,
      absCol,
      col,
      absRow,
      row,
    })
  }

  static fromCoords({ row, col }: { row: number, col: number }): CellLocator {
    return new CellLocator({
      externalGrid: null,
      absCol: false,
      col,
      absRow: false,
      row,
    })
  }

  static fromRowCol({ rowLocator, colLocator }: { rowLocator: RowLocator, colLocator: ColLocator }): CellLocator {
    if (rowLocator.externalGrid !== colLocator.externalGrid) {
      throw new Error(`Row and col external grids do not match: ${rowLocator.externalGrid} !== ${colLocator.externalGrid}`)
    }
    return new CellLocator({
      externalGrid: rowLocator.externalGrid,
      absCol: colLocator.absCol,
      col: colLocator.col,
      absRow: rowLocator.absRow,
      row: rowLocator.row,
    })
  }

  public toString(): string {
    return `${this.externalGrid ? `${this.externalGrid}!` : ''}${this.absCol ? '$' : ''}${getColId(this.col)}${this.absRow ? '$' : ''}${getRowId(this.row)}`
  }

  public override withExternalGrid(externalGrid: string | null): CellLocator {
    if (this.externalGrid === externalGrid) {
      return this
    }
    return new CellLocator({
      externalGrid,
      absCol: this.absCol,
      col: this.col,
      absRow: this.absRow,
      row: this.row,
    })
  }

  public override withoutExternalGrid(): CellLocator {
    if (!this.externalGrid) {
      return this
    }
    return new CellLocator({
      externalGrid: null,
      absCol: this.absCol,
      col: this.col,
      absRow: this.absRow,
      row: this.row,
    })
  }

  public getRowLocator(): RowLocator {
    return new RowLocator({
      externalGrid: this.externalGrid,
      absRow: this.absRow,
      row: this.row,
    })
  }

  public getColLocator(): ColLocator {
    return new ColLocator({
      externalGrid: this.externalGrid,
      absCol: this.absCol,
      col: this.col,
    })
  }

  public toRelative(): CellLocator {
    return new CellLocator({
      externalGrid: this.externalGrid,
      absCol: false,
      col: this.col,
      absRow: false,
      row: this.row,
    })
  }

  public clamp(range: RangeLocator): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
    const clampedRow = Math.max(startRow, Math.min(this.row, endRow))
    const clampedCol = Math.max(startCol, Math.min(this.col, endCol))
    if (clampedRow === this.row && clampedCol === this.col) {
      return this
    }
    return new CellLocator({
      externalGrid: this.externalGrid,
      absCol: this.absCol,
      col: clampedCol,
      absRow: this.absRow,
      row: clampedRow,
    })
  }

  public isSameCell(cellLocator: CellLocator): boolean {
    return (
      this.externalGrid === cellLocator.externalGrid
      && this.col === cellLocator.col
      && this.row === cellLocator.row
    )
  }

  public move(movement: Movement): CellLocator {
    if (!movement.cols && !movement.rows) {
      return this
    }
    return new CellLocator({
      externalGrid: this.externalGrid,
      absCol: this.absCol,
      col: this.col + (movement.cols ?? 0),
      absRow: this.absRow,
      row: this.row + (movement.rows ?? 0),
    })
  }

  public cellMove(dir: Direction, range: RangeLocator, wrap: boolean): CellLocator {
    switch (dir) {
      case 'up': return this.cellUp(range, wrap)
      case 'down': return this.cellDown(range, wrap)
      case 'right': return this.cellRight(range, wrap)
      case 'left': return this.cellLeft(range, wrap)
      case 'top': return this.cellTop(range)
      case 'bottom': return this.cellBottom(range)
      case 'leftmost': return this.cellLeftmost(range)
      case 'rightmost': return this.cellRightmost(range)
    }
  }

  public cellUp(range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
    let row = this.row - 1
    let col = this.col
    if (row < startRow) {
      if (wrap) {
        row = endRow
        col -= 1
        if (col < startCol) {
          col = endCol
        }
      }
      else {
        row = startRow
      }
    }
    return CellLocator.fromCoords({ row, col })
  }

  public cellDown(range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
    let row = this.row + 1
    let col = this.col
    if (row > endRow) {
      if (wrap) {
        row = startRow
        col += 1
        if (col > endCol) {
          col = startCol
        }
      }
      else {
        row = endRow
      }
    }
    return CellLocator.fromCoords({ row, col })
  }

  public cellRight(range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
    let row = this.row
    let col = this.col + 1
    if (col > endCol) {
      if (wrap) {
        col = startCol
        row += 1
        if (row > endRow) {
          row = startRow
        }
      }
      else {
        col = endCol
      }
    }
    return CellLocator.fromCoords({ row, col })
  }

  public cellLeft(range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
    let row = this.row
    let col = this.col - 1
    if (col < startCol) {
      if (wrap) {
        col = endCol
        row -= 1
        if (row < startRow) {
          row = endRow
        }
      }
      else {
        col = startCol
      }
    }
    return CellLocator.fromCoords({ row, col })
  }

  public cellTop(range: RangeLocator): CellLocator {
    const { startRow } = range.toSorted().getCoords()
    return CellLocator.fromCoords({ row: startRow, col: this.col })
  }

  public cellBottom(range: RangeLocator): CellLocator {
    const { endRow } = range.toSorted().getCoords()
    return CellLocator.fromCoords({ row: endRow, col: this.col })
  }

  public cellLeftmost(range: RangeLocator): CellLocator {
    const { startCol } = range.toSorted().getCoords()
    return CellLocator.fromCoords({ row: this.row, col: startCol })
  }

  public cellRightmost(range: RangeLocator): CellLocator {
    const { endCol } = range.toSorted().getCoords()
    return CellLocator.fromCoords({ row: this.row, col: endCol })
  }
}
