import { CellReference } from '../reference/CellReference'
import type {
  ColDeleteTransformation,
  ColInsertBeforeTransformation,
  Transformation,
  MoveTransformation,
  RowDeleteTransformation,
  RowInsertBeforeTransformation,
} from '.'

export function transformCellReference({
  cellReference,
  transformation,
}: {
  cellReference: CellReference
  transformation: Transformation
}): CellReference {
  switch (transformation.type) {
    case 'move':
      return cellTransformMove(cellReference, transformation)
    case 'rowDelete':
      return cellTransformRowDelete(cellReference, transformation)
    case 'colDelete':
      return cellTransformColDelete(cellReference, transformation)
    case 'rowInsertBefore':
      return cellTransformRowInsertBefore(cellReference, transformation)
    case 'colInsertBefore':
      return cellTransformColInsertBefore(cellReference, transformation)
    case 'gridDelete':
    case 'renameGrid':
      throw new Error('Should have been handled')
  }
}

export function cellTransformMove(cellReference: CellReference, { grid, toGrid, toCol, toRow, range }: MoveTransformation): CellReference {
  if (range && !range.containsCell(cellReference)) {
    return cellReference
  }

  const row = cellReference.absRow
    ? cellReference.row
    : cellReference.move(
      {
        toGrid: toGrid ?? grid,
        deltaRow: (toRow ?? cellReference.row) - cellReference.row,
      },
    ).row

  const col = cellReference.absCol
    ? cellReference.col
    : cellReference.move(
      {
        toGrid: toGrid ?? grid,
        deltaCol: (toCol ?? cellReference.col) - cellReference.col,
      },
    ).col

  return new CellReference({
    grid: toGrid ?? grid,
    absRow: cellReference.absRow,
    absCol: cellReference.absCol,
    row,
    col,
  })
}

export function cellTransformRowDelete(cellReference: CellReference, { row, count, grid }: RowDeleteTransformation): CellReference {
  if (cellReference.row >= row && cellReference.row < row + count) {
    throw new Error(`Cell ${cellReference.toStringWithGrid()} was deleted`)
  }

  if (cellReference.row >= row + count) {
    return cellTransformMove(
      cellReference,
      {
        type: 'move',
        grid,
        toRow: cellReference.row - count,
      },
    )
  }
  return cellReference
}

export function cellTransformColDelete(cellReference: CellReference, { col, count, grid }: ColDeleteTransformation): CellReference {
  if (cellReference.col >= col && cellReference.col < col + count) {
    throw new Error(`Cell ${cellReference.toStringWithGrid()} was deleted`)
  }

  if (cellReference.col >= col + count) {
    return cellTransformMove(
      cellReference,
      {
        type: 'move',
        grid,
        toCol: cellReference.col - count,
      },
    )
  }
  return cellReference
}

export function cellTransformRowInsertBefore(cellReference: CellReference, { row, count, grid }: RowInsertBeforeTransformation): CellReference {
  if (cellReference.row >= row) {
    return cellTransformMove(
      cellReference,
      {
        type: 'move',
        grid,
        toRow: cellReference.row + count,
      },
    )
  }
  return cellReference
}

export function cellTransformColInsertBefore(cellReference: CellReference, { col, count, grid }: ColInsertBeforeTransformation): CellReference {
  if (cellReference.col >= col) {
    return cellTransformMove(
      cellReference,
      {
        type: 'move',
        grid,
        toCol: cellReference.col + count,
      },
    )
  }
  return cellReference
}
