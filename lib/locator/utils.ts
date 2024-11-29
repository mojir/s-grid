import { nameCharacterClass } from '@mojir/lits'
import type { CellLocator } from './CellLocator'
import type { RowLocator } from './RowLocator'
import type { ColLocator } from './ColLocator'

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

export type Movement = {
  toGrid: string
  deltaRow?: number
  deltaCol?: number
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
