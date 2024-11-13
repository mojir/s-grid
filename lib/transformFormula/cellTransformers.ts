import { getInfoFromCellIdString, type CellIdStringInfo, type Movement } from '../CellId'
import { Row, type RowRange } from '../Row'
import { Col } from '../Col'
import type { FormulaTransformation } from '.'

export function transformCell(cellIdString: string, transformation: FormulaTransformation): string {
  const cellInfo = getInfoFromCellIdString(cellIdString)
  switch (transformation.type) {
    case 'move':
      return transformMoveOnCell(cellInfo, transformation.movement)
    case 'rowDelete':
      return transformRowDeleteOnCell(cellInfo, transformation.rowRange)
  }
}

export function transformMoveOnCell(cellIdInfo: CellIdStringInfo, { cols, rows }: Movement): string {
  const newColId = cellIdInfo.absoluteCol ? cellIdInfo.colPart : Col.getColIdFromIndex(cellIdInfo.colIndex + cols)
  if (!Col.isColIdString(newColId)) {
    throw new Error(`Invalid column id: ${newColId}`)
  }
  const newRowId = cellIdInfo.absoluteRow ? cellIdInfo.rowPart : Row.getRowIdFromIndex(cellIdInfo.rowIndex + rows)
  if (!Row.isRowIdString(newRowId)) {
    throw new Error(`Invalid row id: ${newRowId}`)
  }

  return `${newColId}${newRowId}`
}

export function transformRowDeleteOnCell(cellIdInfo: CellIdStringInfo, { rowIndex, count }: RowRange): string {
  if (cellIdInfo.rowIndex >= rowIndex && cellIdInfo.rowIndex < rowIndex + count) {
    throw new Error(`Cell ${cellIdInfo.id} is in deleted row range`)
  }

  if (cellIdInfo.rowIndex >= rowIndex + count) {
    return transformMoveOnCell(cellIdInfo, { cols: 0, rows: -count })
  }
  return cellIdInfo.id
}
