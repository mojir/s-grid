import type { Grid } from '../grid/Grid'
import type { RangeReference } from '../reference/RangeReference'

export type RenameGridTransformation = {
  grid: Grid
  type: 'renameGrid'
  newName: string
}

export type GridDeleteTransformation = {
  grid: Grid
  type: 'gridDelete'
}

export type MoveTransformation = {
  grid: Grid
  type: 'move'
  range?: RangeReference
  toGrid?: Grid
  toRowIndex?: number
  toColIndex?: number
}

export type RowDeleteTransformation = {
  grid: Grid
  type: 'rowDelete'
  rowIndex: number
  count: number
}

export type ColDeleteTransformation = {
  grid: Grid
  type: 'colDelete'
  colIndex: number
  count: number
}

export type RowInsertBeforeTransformation = {
  grid: Grid
  type: 'rowInsertBefore'
  rowIndex: number
  count: number
}

export type ColInsertBeforeTransformation = {
  grid: Grid
  type: 'colInsertBefore'
  colIndex: number
  count: number
}

export type Transformation = GridDeleteTransformation | RenameGridTransformation | MoveTransformation | RowDeleteTransformation | ColDeleteTransformation | RowInsertBeforeTransformation | ColInsertBeforeTransformation
