import type { Grid } from '../grid/Grid'
import type { Project } from '../project/Project'
import { CellReference, isCellReferenceString } from './CellReference'
import { isRangeReferenceString, RangeReference } from './RangeReference'

export type Reference = CellReference | RangeReference

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

export function getDocumentCellId(cellReference: CellReference): string {
  return `${DocumentIdType.Cell}:${cellReference.grid.name.value}:${cellReference.toRelative().toStringWithoutGrid()}`
}

export function getDocumentRowId(grid: Grid, rowIndex: number): string {
  return `${DocumentIdType.Row}:${grid.name.value}:${rowIndex}`
}

export function getDocumentResizeRowId(grid: Grid, rowIndex: number): string {
  return `${DocumentIdType.ResizeRow}:${grid.name.value}:${rowIndex}`
}

export function getDocumentColId(grid: Grid, colIndex: number): string {
  return `${DocumentIdType.Col}:${grid.name.value}:${colIndex}`
}

export function getDocumentResizeColId(grid: Grid, colIndex: number): string {
  return `${DocumentIdType.ResizeCol}:${grid.name.value}:${colIndex}`
}

export function getReferenceFromString(currenctGrid: Grid, referenceString: string): Reference | null {
  return isCellReferenceString(referenceString)
    ? CellReference.fromString(currenctGrid, referenceString)
    : isRangeReferenceString(referenceString)
      ? RangeReference.fromString(currenctGrid, referenceString)
      : null
}

export function getReferenceFromStringWithGrid(project: Project, referenceString: string): Reference {
  if (!isReferenceString(referenceString)) {
    throw new Error(`Invalid reference string: ${referenceString}`)
  }

  const gridName = referenceString.split('!')[0]!
  const grid = project.getGridByName(gridName)

  return isCellReferenceString(referenceString)
    ? CellReference.fromString(grid, referenceString)
    : RangeReference.fromString(grid, referenceString)
}

export function isReferenceString(referenceString: string): boolean {
  return isCellReferenceString(referenceString) || isRangeReferenceString(referenceString)
}
