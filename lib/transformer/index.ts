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
  toRow?: number
  toCol?: number
}

export type RowDeleteTransformation = {
  grid: Grid
  type: 'rowDelete'
  row: number
  count: number
}

export type ColDeleteTransformation = {
  grid: Grid
  type: 'colDelete'
  col: number
  count: number
}

export type RowInsertBeforeTransformation = {
  grid: Grid
  type: 'rowInsertBefore'
  row: number
  count: number
}

export type ColInsertBeforeTransformation = {
  grid: Grid
  type: 'colInsertBefore'
  col: number
  count: number
}

export type Transformation = GridDeleteTransformation | RenameGridTransformation | MoveTransformation | RowDeleteTransformation | ColDeleteTransformation | RowInsertBeforeTransformation | ColInsertBeforeTransformation
