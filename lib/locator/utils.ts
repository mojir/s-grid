import { nameCharacterClass } from '@mojir/lits'
import type { CellLocator } from './CellLocator'
import type { RowLocator } from './RowLocator'
import type { ColLocator } from './ColLocator'

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

export type Movement = {
  rows?: number
  cols?: number
}

const colPart = '(\\$?)([A-Z]{1,2})' // Two groups
const rowPart = '(\\$?)([1-9]\\d{0,3})' // Two groups
const cellPart = `${colPart}${rowPart}` // Four groups
const gridPart = `(?:(?<grid>${nameCharacterClass}+)!)?` // One group

export const cellLocatorRegExp = new RegExp(`^${gridPart}${cellPart}$`)
export const rowLocatorRegExp = new RegExp(`^${gridPart}@?${rowPart}$`)
export const colLocatorRegExp = new RegExp(`^${gridPart}${colPart}$`)
export const rowRangeLocatorRegExp = new RegExp(`^${gridPart}(?<start>${rowPart})-(?<end>${rowPart})$`)
export const colRangeLocatorRegExp = new RegExp(`^${gridPart}(?<start>${colPart})-(?<end>${colPart})$`)
export const rangeLocatorRegExp = new RegExp(`^${gridPart}(?<start>${cellPart})-(?<end>${cellPart})$`)

export function getMovement(from: CellLocator, to: CellLocator): Movement {
  if (from.externalGrid !== to.externalGrid) {
    throw new Error('Cannot calculate movement between cells in different grids')
  }
  return {
    cols: to.col - from.col,
    rows: to.row - from.row,
  }
}

export enum DocumetIdType {
  Cell = 'cell',
  Row = 'row',
  Col = 'col',
  ResizeRow = 'resize-row',
  ResizeCol = 'resize-col',
}

export function getDocumentCellId(cellLocator: CellLocator, gridName: string): string {
  return `${DocumetIdType.Cell}:${gridName}:${cellLocator.withoutExternalGrid().toRelative().toString()}`
}

export function getDocumentRowId(rowLocator: RowLocator, gridName: string): string {
  return `${DocumetIdType.Row}:${gridName}:${rowLocator.withoutExternalGrid().toRelative().toString()}`
}

export function getDocumentResizeRowId(rowLocator: RowLocator, gridName: string): string {
  return `${DocumetIdType.ResizeRow}:${gridName}:${rowLocator.withoutExternalGrid().toRelative().toString()}`
}

export function getDocumentColId(colLocator: ColLocator, gridName: string): string {
  return `${DocumetIdType.Col}:${gridName}:${colLocator.withoutExternalGrid().toRelative().toString()}`
}

export function getDocumentResizeColId(colLocator: ColLocator, gridName: string): string {
  return `${DocumetIdType.ResizeCol}:${gridName}:${colLocator.withoutExternalGrid().toRelative().toString()}`
}
