import type { CellReference } from '../reference/CellReference'
import { RangeReference } from '../reference/RangeReference'
import { cellTransformColInsertBefore, cellTransformMove, cellTransformRowInsertBefore } from './cellReferenceTransformer'
import type { ColDeleteTransformation, ColInsertBeforeTransformation, Transformation, RowDeleteTransformation, RowInsertBeforeTransformation } from '.'

export function transformRangeReference({
  rangeReference,
  transformation,
}: {
  rangeReference: RangeReference
  transformation: Transformation
}): RangeReference {
  switch (transformation.type) {
    case 'move':
      return RangeReference.fromCellReferences(
        cellTransformMove(rangeReference.start, transformation),
        cellTransformMove(rangeReference.end, transformation),
      )
    case 'rowDelete':
      return rangeTransformRowDelete(rangeReference, transformation)
    case 'colDelete':
      return rangeTransformColDelete(rangeReference, transformation)
    case 'rowInsertBefore':
      return rangeTransformRowInsertBefore(rangeReference, transformation)
    case 'colInsertBefore':
      return rangeTransformColInsertBefore(rangeReference, transformation)
    case 'gridDelete':
    case 'renameGrid':
      throw new Error('Should have been handled')
  }
}

function rangeTransformRowDelete(rangeReference: RangeReference, { row, count, grid }: RowDeleteTransformation): RangeReference {
  const { start, end } = rangeReference
  const startIsInDeletedRange
    = start.row >= row
    && start.row < row + count

  const endIsInDeletedRange
    = end.row >= row
    && end.row < row + count

  // range reference is enclosed in deleted row range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${rangeReference.toStringWithGrid()} was deleted`)
  }

  // range reference is below and intersecting deleted row range
  if (startIsInDeletedRange) {
    const newStart = cellTransformMove(
      start,
      {
        type: 'move',
        grid,
        toRow: row,
      })
    const newEnd = cellTransformMove(
      end,
      {
        type: 'move',
        grid,
        toRow: end.row - count,
      },
    )

    return RangeReference.fromCellReferences(newStart, newEnd)
  }

  // range is above and intersecting deleted row range
  if (endIsInDeletedRange) {
    const newEnd = cellTransformMove(
      end,
      {
        type: 'move',
        grid,
        toRow: row - 1,
      },
    )

    return RangeReference.fromCellReferences(start, newEnd)
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.row >= row + count
  const endIsBelowDeletedRange = end.row >= row + count

  const newStart: CellReference = startIsBelowDeletedRange
    ? cellTransformMove(
        start,
        {
          type: 'move',
          grid,
          toRow: start.row - count,
        },
      )
    : start

  const newEnd: CellReference = endIsBelowDeletedRange
    ? cellTransformMove(
        end,
        {
          type: 'move',
          grid,
          toRow: end.row - count,
        },
      )
    : end

  return RangeReference.fromCellReferences(newStart, newEnd)
}

function rangeTransformColDelete(rangeReference: RangeReference, { col, count, grid }: ColDeleteTransformation): RangeReference {
  const { start, end } = rangeReference

  const startIsInDeletedRange
    = start.col >= col
    && start.col < col + count

  const endIsInDeletedRange
    = end.col >= col
    && end.col < col + count

  // range reference is enclosed in deleted col range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${rangeReference.toStringWithGrid()} was deleted`)
  }

  // range reference is to the right and intersecting deleted col range
  if (startIsInDeletedRange) {
    const newStart = cellTransformMove(
      start,
      {
        type: 'move',
        grid,
        toCol: col,
      },
    )
    const newEnd = cellTransformMove(
      end,
      {
        type: 'move',
        grid,
        toCol: end.col - count,
      },
    )

    return RangeReference.fromCellReferences(newStart, newEnd)
  }

  // range is to the right and intersecting deleted col range
  if (endIsInDeletedRange) {
    const newEnd = cellTransformMove(
      end,
      {
        type: 'move',
        grid,
        toCol: col - 1,
      },
    )

    return RangeReference.fromCellReferences(start, newEnd)
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.col >= col + count
  const endIsRightOfDeletedRange = end.col >= col + count

  const newStart: CellReference = startIsRightOfDeletedRange
    ? cellTransformMove(
        start,
        {
          type: 'move',
          grid,
          toCol: start.col - count,
        },
      )
    : start
  const newEnd: CellReference = endIsRightOfDeletedRange
    ? cellTransformMove(
        end,
        {
          type: 'move',
          grid,
          toCol: end.col - count,
        },
      )
    : end

  return RangeReference.fromCellReferences(newStart, newEnd)
}

function rangeTransformRowInsertBefore({ start, end }: RangeReference, transformation: RowInsertBeforeTransformation): RangeReference {
  const newStart = cellTransformRowInsertBefore(start, transformation)
  const newEnd = cellTransformRowInsertBefore(end, transformation)
  return RangeReference.fromCellReferences(newStart, newEnd)
}

function rangeTransformColInsertBefore({ start, end }: RangeReference, transformation: ColInsertBeforeTransformation): RangeReference {
  const newStart = cellTransformColInsertBefore(start, transformation)
  const newEnd = cellTransformColInsertBefore(end, transformation)
  return RangeReference.fromCellReferences(newStart, newEnd)
}
