import type { CellLocator } from './CellLocator'
import type { RowLocator } from './RowLocator'
import type { ColLocator } from './ColLocator'

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

export type Movement = {
  toGrid: string
  deltaRow?: number
  deltaCol?: number
}

export enum DocumetIdType {
  Cell = 'cell',
  Row = 'row',
  Col = 'col',
  ResizeRow = 'resize-row',
  ResizeCol = 'resize-col',
}

export function getDocumentCellId(cellLocator: CellLocator, gridName: string): string {
  return `${DocumetIdType.Cell}:${gridName}:${cellLocator.toRelative().toStringWithoutGrid()}`
}

export function getDocumentRowId(rowLocator: RowLocator, gridName: string): string {
  return `${DocumetIdType.Row}:${gridName}:${rowLocator.toRelative().toStringWithoutGrid()}`
}

export function getDocumentResizeRowId(rowLocator: RowLocator, gridName: string): string {
  return `${DocumetIdType.ResizeRow}:${gridName}:${rowLocator.toRelative().toStringWithoutGrid()}`
}

export function getDocumentColId(colLocator: ColLocator, gridName: string): string {
  return `${DocumetIdType.Col}:${gridName}:${colLocator.toRelative().toStringWithoutGrid()}`
}

export function getDocumentResizeColId(colLocator: ColLocator, gridName: string): string {
  return `${DocumetIdType.ResizeCol}:${gridName}:${colLocator.toRelative().toStringWithoutGrid()}`
}
