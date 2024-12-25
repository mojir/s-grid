import { CellReference } from '../reference/CellReference'
import type { Grid } from '../grid/Grid'
import type {
  ColDeleteTransformation,
  ColInsertBeforeTransformation,
  FormulaTransformation,
  MoveTransformation,
  RowDeleteTransformation,
  RowInsertBeforeTransformation,
} from '.'

export function transformCellReference({
  cellGrid,
  cellReference,
  transformation,
}: {
  cellGrid: Grid
  cellReference: CellReference
  transformation: FormulaTransformation
}): string {
  switch (transformation.type) {
    case 'move':
      return cellTransformMove(cellGrid, cellReference, transformation)
    case 'rowDelete':
      return cellTransformRowDelete(cellGrid, cellReference, transformation)
    case 'colDelete':
      return cellTransformColDelete(cellGrid, cellReference, transformation)
    case 'rowInsertBefore':
      return cellTransformRowInsertBefore(cellGrid, cellReference, transformation)
    case 'colInsertBefore':
      return cellTransformColInsertBefore(cellGrid, cellReference, transformation)
    case 'gridDelete':
    case 'renameGrid':
      throw new Error('Should have been handled')
  }
}

export function cellTransformMove(cellGrid: Grid, cellReference: CellReference, { movement: { toGrid, deltaCol: cols, deltaRow: rows }, range }: MoveTransformation): string {
  if (range && !range.containsCell(cellReference)) {
    return cellReference.toString(cellGrid)
  }

  const row = cellReference.absRow
    ? cellReference.row
    : cellReference.move(
      {
        toGrid,
        deltaRow: rows,
      },
    ).row

  const col = cellReference.absCol
    ? cellReference.col
    : cellReference.move(
      {
        toGrid,
        deltaCol: cols,
      },
    ).col

  return new CellReference({
    grid: toGrid,
    absRow: cellReference.absRow,
    absCol: cellReference.absCol,
    row,
    col,
  }).toString(cellGrid)
}

export function cellTransformRowDelete(cellGrid: Grid, cellReference: CellReference, { row, count, sourceGrid }: RowDeleteTransformation): string {
  if (cellReference.row >= row && cellReference.row < row + count) {
    throw new Error(`Cell ${cellReference.toString(cellGrid)} was deleted`)
  }

  if (cellReference.row >= row + count) {
    return cellTransformMove(
      cellGrid,
      cellReference,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: -count,
        },
      },
    )
  }
  return cellReference.toString(cellGrid)
}

export function cellTransformColDelete(cellGrid: Grid, cellReference: CellReference, { col, count, sourceGrid }: ColDeleteTransformation): string {
  if (cellReference.col >= col && cellReference.col < col + count) {
    throw new Error(`Cell ${cellReference.toString(cellGrid)} was deleted`)
  }

  if (cellReference.col >= col + count) {
    return cellTransformMove(
      cellGrid,
      cellReference,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: -count,
          deltaRow: 0,
        },
      },
    )
  }
  return cellReference.toString(cellGrid)
}

export function cellTransformRowInsertBefore(cellGrid: Grid, cellReference: CellReference, { row, count, sourceGrid }: RowInsertBeforeTransformation): string {
  if (cellReference.row >= row) {
    return cellTransformMove(
      cellGrid,
      cellReference,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: count,
        },
      },
    )
  }
  return cellReference.toString(cellGrid)
}

export function cellTransformColInsertBefore(cellGrid: Grid, cellReference: CellReference, { col, count, sourceGrid }: ColInsertBeforeTransformation): string {
  if (cellReference.col >= col) {
    return cellTransformMove(
      cellGrid,
      cellReference,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: count,
          deltaRow: 0,
        },
      },
    )
  }
  return cellReference.toString(cellGrid)
}
