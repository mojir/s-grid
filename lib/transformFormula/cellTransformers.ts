import { CellId, getInfoFromCellIdString, type CellIdStringInfo, type Movement } from '../CellId'
import { Row, type RowRange } from '../Row'
import { Col, type ColRange } from '../Col'
import type { CellRange } from '../CellRange'
import type { FormulaTransformation } from '.'

export function transformCell(cellIdString: string, transformation: FormulaTransformation): string {
  const cellInfo = getInfoFromCellIdString(cellIdString)
  switch (transformation.type) {
    case 'move':
      return transformMoveOnCell(cellInfo, transformation.movement, transformation.range)
    case 'rowDelete':
      return transformRowDeleteOnCell(cellInfo, transformation.rowRange)
    case 'colDelete':
      return transformColDeleteOnCell(cellInfo, transformation.colRange)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnCell(cellInfo, transformation.rowRange)
    case 'colInsertBefore':
      return transformColInsertBeforeOnCell(cellInfo, transformation.colRange)
  }
}

export function transformMoveOnCell(cellIdInfo: CellIdStringInfo, { cols, rows }: Movement, range?: CellRange): string {
  if (range && !range.contains(CellId.fromId(cellIdInfo.id))) {
    return cellIdInfo.id
  }
  const newColId = cellIdInfo.absoluteCol ? cellIdInfo.colPart : Col.getColIdFromIndex(cellIdInfo.colIndex + cols)
  if (!cellIdInfo.absoluteCol && !Col.isColIdString(newColId)) {
    throw new Error(`Invalid column id: ${newColId}`)
  }
  const newRowId = cellIdInfo.absoluteRow ? cellIdInfo.rowPart : Row.getRowIdFromIndex(cellIdInfo.rowIndex + rows)
  if (!cellIdInfo.absoluteRow && !Row.isRowIdString(newRowId)) {
    throw new Error(`Invalid row id: ${newRowId}`)
  }
  return `${newColId}${newRowId}`
}

export function transformRowDeleteOnCell(cellIdInfo: CellIdStringInfo, { rowIndex, count }: RowRange): string {
  if (cellIdInfo.rowIndex >= rowIndex && cellIdInfo.rowIndex < rowIndex + count) {
    throw new Error(`Cell ${cellIdInfo.id} was deleted`)
  }

  if (cellIdInfo.rowIndex >= rowIndex + count) {
    return transformMoveOnCell(cellIdInfo, { cols: 0, rows: -count })
  }
  return cellIdInfo.id
}

export function transformColDeleteOnCell(cellIdInfo: CellIdStringInfo, { colIndex, count }: ColRange): string {
  if (cellIdInfo.colIndex >= colIndex && cellIdInfo.colIndex < colIndex + count) {
    throw new Error(`Cell ${cellIdInfo.id} was deleted`)
  }

  if (cellIdInfo.colIndex >= colIndex + count) {
    return transformMoveOnCell(cellIdInfo, { cols: -count, rows: 0 })
  }
  return cellIdInfo.id
}

export function transformRowInsertBeforeOnCell(cellIdInfo: CellIdStringInfo, { rowIndex, count }: RowRange): string {
  if (cellIdInfo.rowIndex >= rowIndex) {
    return transformMoveOnCell(cellIdInfo, { cols: 0, rows: count })
  }
  return cellIdInfo.id
}

export function transformColInsertBeforeOnCell(cellIdInfo: CellIdStringInfo, { colIndex, count }: ColRange): string {
  if (cellIdInfo.colIndex >= colIndex) {
    return transformMoveOnCell(cellIdInfo, { cols: count, rows: 0 })
  }
  return cellIdInfo.id
}
