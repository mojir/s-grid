import { CellReference } from '../reference/CellReference'
import type {
  ColDeleteTransformation,
  ColInsertBeforeTransformation,
  ReferenceTransformation,
  MoveTransformation,
  RowDeleteTransformation,
  RowInsertBeforeTransformation,
} from '.'

export function transformCellReference({
  cellReference,
  transformation,
}: {
  cellReference: CellReference
  transformation: ReferenceTransformation
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

export function cellTransformMove(cellReference: CellReference, { grid, toGrid, toRowIndex, toColIndex, deltaRow, deltaCol, range }: MoveTransformation): CellReference {
  if (range && !range.containsCell(cellReference)) {
    return cellReference
  }

  const rowIndex = cellReference.absRow
    ? cellReference.rowIndex
    : cellReference.move(
      {
        toGrid: toGrid ?? grid,
        deltaRow: deltaRow ?? (toRowIndex ?? cellReference.rowIndex) - cellReference.rowIndex,
      },
    ).rowIndex

  const colIndex = cellReference.absCol
    ? cellReference.colIndex
    : cellReference.move(
      {
        toGrid: toGrid ?? grid,
        deltaCol: deltaCol ?? (toColIndex ?? cellReference.colIndex) - cellReference.colIndex,
      },
    ).colIndex

  return new CellReference({
    grid: toGrid ?? grid,
    absRow: cellReference.absRow,
    absCol: cellReference.absCol,
    rowIndex,
    colIndex,
  })
}

export function cellTransformRowDelete(cellReference: CellReference, { rowIndex, count, grid }: RowDeleteTransformation): CellReference {
  if (cellReference.rowIndex >= rowIndex && cellReference.rowIndex < rowIndex + count) {
    throw new Error(`Cell ${cellReference.toStringWithGrid()} was deleted`)
  }

  if (cellReference.rowIndex >= rowIndex + count) {
    return cellTransformMove(
      cellReference,
      {
        type: 'move',
        grid,
        toRowIndex: cellReference.rowIndex - count,
      },
    )
  }
  return cellReference
}

export function cellTransformColDelete(cellReference: CellReference, { colIndex, count, grid }: ColDeleteTransformation): CellReference {
  if (cellReference.colIndex >= colIndex && cellReference.colIndex < colIndex + count) {
    throw new Error(`Cell ${cellReference.toStringWithGrid()} was deleted`)
  }

  if (cellReference.colIndex >= colIndex + count) {
    return cellTransformMove(
      cellReference,
      {
        type: 'move',
        grid,
        toColIndex: cellReference.colIndex - count,
      },
    )
  }
  return cellReference
}

export function cellTransformRowInsertBefore(cellReference: CellReference, { rowIndex, count, grid }: RowInsertBeforeTransformation): CellReference {
  if (cellReference.rowIndex >= rowIndex) {
    return cellTransformMove(
      cellReference,
      {
        type: 'move',
        grid,
        toRowIndex: cellReference.rowIndex + count,
      },
    )
  }
  return cellReference
}

export function cellTransformColInsertBefore(cellReference: CellReference, { colIndex, count, grid }: ColInsertBeforeTransformation): CellReference {
  if (cellReference.colIndex >= colIndex) {
    return cellTransformMove(
      cellReference,
      {
        type: 'move',
        grid,
        toColIndex: cellReference.colIndex + count,
      },
    )
  }
  return cellReference
}
