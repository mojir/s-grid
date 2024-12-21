import type { Grid } from '../grid/Grid'
import { CellLocator, isCellLocatorString } from './CellLocator'
import type { RowLocator } from './RowLocator'
import type { ColLocator } from './ColLocator'
import { isRangeLocatorString, RangeLocator } from './RangeLocator'
import type { RowRangeLocator } from './RowRangeLocator'
import type { ColRangeLocator } from './ColRangeLocator'

export type Direction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'leftmost'
  | 'rightmost'
  | 'pageUp'
  | 'pageDown'
  | 'pageRight'
  | 'pageLeft'

export type Movement = {
  toGrid: Grid
  deltaRow?: number
  deltaCol?: number
}

export enum DocumentIdType {
  Cell = 'cell',
  Row = 'row',
  Col = 'col',
  ResizeRow = 'resize-row',
  ResizeCol = 'resize-col',
}

export function getDocumentCellId(cellLocator: CellLocator): string {
  return `${DocumentIdType.Cell}:${cellLocator.grid.name.value}:${cellLocator.toRelative().toStringWithoutGrid()}`
}

// TODO remove girdName parameter
export function getDocumentRowId(rowLocator: RowLocator): string {
  return `${DocumentIdType.Row}:${rowLocator.grid.name.value}:${rowLocator.toRelative().toStringWithoutGrid()}`
}

export function getDocumentResizeRowId(rowLocator: RowLocator): string {
  return `${DocumentIdType.ResizeRow}:${rowLocator.grid.name.value}:${rowLocator.toRelative().toStringWithoutGrid()}`
}

export function getDocumentColId(colLocator: ColLocator): string {
  return `${DocumentIdType.Col}:${colLocator.grid.name.value}:${colLocator.toRelative().toStringWithoutGrid()}`
}

export function getDocumentResizeColId(colLocator: ColLocator): string {
  return `${DocumentIdType.ResizeCol}:${colLocator.grid.name.value}:${colLocator.toRelative().toStringWithoutGrid()}`
}

export type ReferenceLocator = CellLocator | RangeLocator
export type AnyLocator = ReferenceLocator | RowLocator | RowRangeLocator | ColLocator | ColRangeLocator

export function getReferenceLocatorFromString(grid: Grid, locatorString: string): ReferenceLocator | null {
  if (!locatorString) {
    return null
  }
  return isCellLocatorString(locatorString)
    ? CellLocator.fromString(grid, locatorString)
    : isRangeLocatorString(locatorString)
      ? RangeLocator.fromString(grid, locatorString)
      : null
}
