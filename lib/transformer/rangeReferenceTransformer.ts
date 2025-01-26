import type { CellReference } from '../reference/CellReference'
import { RangeReference } from '../reference/RangeReference'
import { cellTransformColInsertBefore, cellTransformMove, cellTransformRowInsertBefore } from './cellReferenceTransformer'
import type { ColDeleteTransformation, ColInsertBeforeTransformation, ReferenceTransformation, RowDeleteTransformation, RowInsertBeforeTransformation } from '.'

export function transformRangeReference({
  rangeReference,
  transformation,
}: {
  rangeReference: RangeReference
  transformation: ReferenceTransformation
}): RangeReference {
  switch (transformation.type) {
    case 'move':
      return RangeReference.fromCellReferences(
        cellTransformMove(rangeReference.start, transformation),
        typeof transformation.toColIndex === 'number' && typeof transformation.toRowIndex === 'number'
          ? cellTransformMove(rangeReference.end, {
              type: 'move',
              grid: transformation.grid,
              toGrid: transformation.toGrid,
              range: transformation.range,
              toColIndex: transformation.toColIndex + (rangeReference.end.colIndex - rangeReference.start.colIndex),
              toRowIndex: transformation.toRowIndex + (rangeReference.end.rowIndex - rangeReference.start.rowIndex),

            })
          : cellTransformMove(rangeReference.end, transformation),
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

function rangeTransformRowDelete(rangeReference: RangeReference, { rowIndex, count, grid }: RowDeleteTransformation): RangeReference {
  const { start, end } = rangeReference
  const startIsInDeletedRange
    = start.rowIndex >= rowIndex
      && start.rowIndex < rowIndex + count

  const endIsInDeletedRange
    = end.rowIndex >= rowIndex
      && end.rowIndex < rowIndex + count

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
        toRowIndex: rowIndex,
      })
    const newEnd = cellTransformMove(
      end,
      {
        type: 'move',
        grid,
        toRowIndex: end.rowIndex - count,
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
        toRowIndex: rowIndex - 1,
      },
    )

    return RangeReference.fromCellReferences(start, newEnd)
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.rowIndex >= rowIndex + count
  const endIsBelowDeletedRange = end.rowIndex >= rowIndex + count

  const newStart: CellReference = startIsBelowDeletedRange
    ? cellTransformMove(
        start,
        {
          type: 'move',
          grid,
          toRowIndex: start.rowIndex - count,
        },
      )
    : start

  const newEnd: CellReference = endIsBelowDeletedRange
    ? cellTransformMove(
        end,
        {
          type: 'move',
          grid,
          toRowIndex: end.rowIndex - count,
        },
      )
    : end

  return RangeReference.fromCellReferences(newStart, newEnd)
}

function rangeTransformColDelete(rangeReference: RangeReference, { colIndex, count, grid }: ColDeleteTransformation): RangeReference {
  const { start, end } = rangeReference

  const startIsInDeletedRange
    = start.colIndex >= colIndex
      && start.colIndex < colIndex + count

  const endIsInDeletedRange
    = end.colIndex >= colIndex
      && end.colIndex < colIndex + count

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
        toColIndex: colIndex,
      },
    )
    const newEnd = cellTransformMove(
      end,
      {
        type: 'move',
        grid,
        toColIndex: end.colIndex - count,
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
        toColIndex: colIndex - 1,
      },
    )

    return RangeReference.fromCellReferences(start, newEnd)
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.colIndex >= colIndex + count
  const endIsRightOfDeletedRange = end.colIndex >= colIndex + count

  const newStart: CellReference = startIsRightOfDeletedRange
    ? cellTransformMove(
        start,
        {
          type: 'move',
          grid,
          toColIndex: start.colIndex - count,
        },
      )
    : start
  const newEnd: CellReference = endIsRightOfDeletedRange
    ? cellTransformMove(
        end,
        {
          type: 'move',
          grid,
          toColIndex: end.colIndex - count,
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
