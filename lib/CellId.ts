import type { CellRange } from './CellRange'
import { Col, type ColIdString } from './Col'
import { Row, type RowIdString } from './Row'
import type { Direction } from '~/composables/useGrid'

export type Movement = {
  rows: number
  cols: number
}

const cellIdStringRegExp = /^(\$?)([A-Z]+)(\$?)(\d+)$/

export type CellIdStringInfo = {
  id: string
  colPart: string
  rowPart: string
  colId: ColIdString
  rowId: RowIdString
  colIndex: number
  rowIndex: number
  absoluteCol: boolean
  absoluteRow: boolean
}

export function getInfoFromCellIdString(cellIdString: string): CellIdStringInfo {
  const match = cellIdStringRegExp.exec(cellIdString)

  if (!match) {
    throw new Error(`Invalid cell id: ${cellIdString}`)
  }

  const colId = match[2] as ColIdString
  const rowId = match[4] as RowIdString

  const absoluteCol = !!match[1]
  const absoluteRow = !!match[3]

  const colIndex = Col.getColIndexFromId(colId)
  const rowIndex = Row.getRowIndexFromId(rowId)

  return {
    id: cellIdString,
    colPart: absoluteCol ? `$${colId}` : colId,
    rowPart: absoluteRow ? `$${rowId}` : rowId,
    colId,
    rowId,
    colIndex,
    rowIndex,
    absoluteCol,
    absoluteRow,
  }
}
export class CellId {
  private constructor(
    public readonly rowIndex: number,
    public readonly colIndex: number,
    public readonly id: string,
  ) {}

  static fromId(id: string): CellId {
    const match = id.match(cellIdStringRegExp)
    if (!match) {
      throw new Error(`Invalid cell id: ${id}`)
    }
    const colId = match[2] as ColIdString
    const rowId = match[4] as RowIdString
    return new CellId(Number(rowId) - 1, Col.getColIndexFromId(colId), id)
  }

  static fromCoords(rowIndex: number, colIndex: number): CellId {
    return new CellId(rowIndex, colIndex, `${Col.getColIdFromIndex(colIndex)}${rowIndex + 1}`)
  }

  static isCellId(value: unknown): value is CellId {
    return value instanceof CellId
  }

  static isCellIdString(id: string): boolean {
    return cellIdStringRegExp.test(id)
  }

  public getMovementTo(cellId: CellId): Movement {
    return {
      rows: cellId.rowIndex - this.rowIndex,
      cols: cellId.colIndex - this.colIndex,
    }
  }

  public clamp(range: CellRange): CellId {
    const [startRow, startCol, endRow, endCol] = range.toCoords()
    const clampedRow = Math.max(startRow, Math.min(this.rowIndex, endRow))
    const clampedCol = Math.max(startCol, Math.min(this.colIndex, endCol))
    return CellId.fromCoords(clampedRow, clampedCol)
  }

  public equals(cellId: CellId): boolean {
    return this.id === cellId.id
  }

  public cellMove(dir: Direction, range: CellRange, wrap: boolean): CellId {
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

  public cellUp(range: CellRange, wrap: boolean): CellId {
    const [startRow, startCol, endRow, endCol] = range.toSorted().toCoords()
    let nextRow = this.rowIndex - 1
    let nextCol = this.colIndex
    if (nextRow < startRow) {
      if (wrap) {
        nextRow = endRow
        nextCol -= 1
        if (nextCol < startCol) {
          nextCol = endCol
        }
      }
      else {
        nextRow = startRow
      }
    }
    return CellId.fromCoords(nextRow, nextCol)
  }

  public cellDown(range: CellRange, wrap: boolean): CellId {
    const [startRow, startCol, endRow, endCol] = range.toSorted().toCoords()
    let nextRow = this.rowIndex + 1
    let nextCol = this.colIndex
    if (nextRow > endRow) {
      if (wrap) {
        nextRow = startRow
        nextCol += 1
        if (nextCol > endCol) {
          nextCol = startCol
        }
      }
      else {
        nextRow = endRow
      }
    }
    return CellId.fromCoords(nextRow, nextCol)
  }

  public cellRight(range: CellRange, wrap: boolean): CellId {
    const [startRow, startCol, endRow, endCol] = range.toSorted().toCoords()
    let nextRow = this.rowIndex
    let nextCol = this.colIndex + 1
    if (nextCol > endCol) {
      if (wrap) {
        nextCol = startCol
        nextRow += 1
        if (nextRow > endRow) {
          nextRow = startRow
        }
      }
      else {
        nextCol = endCol
      }
    }
    return CellId.fromCoords(nextRow, nextCol)
  }

  public cellLeft(range: CellRange, wrap: boolean): CellId {
    const [startRow, startCol, endRow, endCol] = range.toSorted().toCoords()
    let nextRow = this.rowIndex
    let nextCol = this.colIndex - 1
    if (nextCol < startCol) {
      if (wrap) {
        nextCol = endCol
        nextRow -= 1
        if (nextRow < startRow) {
          nextRow = endRow
        }
      }
      else {
        nextCol = startCol
      }
    }
    return CellId.fromCoords(nextRow, nextCol)
  }

  public cellTop(range: CellRange): CellId {
    const [startRow] = range.toSorted().toCoords()
    return CellId.fromCoords(startRow, this.colIndex)
  }

  public cellBottom(range: CellRange): CellId {
    const [, , endRow] = range.toSorted().toCoords()
    return CellId.fromCoords(endRow, this.colIndex)
  }

  public cellLeftmost(range: CellRange): CellId {
    const [startCol] = range.toSorted().toCoords()
    return CellId.fromCoords(this.rowIndex, startCol)
  }

  public cellRightmost(range: CellRange): CellId {
    const [, , , endCol] = range.toSorted().toCoords()
    return CellId.fromCoords(this.rowIndex, endCol)
  }

  public getRowId(): RowIdString {
    return Row.getRowIdFromIndex(this.rowIndex)
  }

  public getColId(): ColIdString {
    return Col.getColIdFromIndex(this.colIndex)
  }
}
