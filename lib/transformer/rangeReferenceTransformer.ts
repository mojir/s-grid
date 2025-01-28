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

  const endRowIndex = rowIndex + count - 1
  const startIsInDeletedRange = start.rowIndex >= rowIndex && start.rowIndex <= endRowIndex
  const endIsInDeletedRange = end.rowIndex >= rowIndex && end.rowIndex <= endRowIndex
  const startIsAfterDeletedRange = start.rowIndex > endRowIndex
  const endIsAfterDeletedRange = end.rowIndex > endRowIndex

  // range reference is enclosed in deleted row range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${rangeReference.toStringWithGrid()} was deleted`)
  }

  const startDeltaRow = startIsAfterDeletedRange
    ? -count
    : startIsInDeletedRange
      ? rowIndex - start.rowIndex
      : 0

  const endDeltaRow = endIsAfterDeletedRange
    ? -count
    : endIsInDeletedRange
      ? rowIndex - end.rowIndex - 1
      : 0

  const newStart = startDeltaRow
    ? cellTransformMove(
        start,
        {
          type: 'move',
          grid,
          deltaRow: startDeltaRow,
        },
      )
    : start

  const newEnd = endDeltaRow
    ? cellTransformMove(
        end,
        {
          type: 'move',
          grid,
          deltaRow: endDeltaRow,
        },
      )
    : end

  return RangeReference.fromCellReferences(newStart, newEnd)
}

function rangeTransformColDelete(rangeReference: RangeReference, { colIndex, count, grid }: ColDeleteTransformation): RangeReference {
  const { start, end } = rangeReference

  const endColIndex = colIndex + count - 1
  const startIsInDeletedRange = start.colIndex >= colIndex && start.colIndex <= endColIndex
  const endIsInDeletedRange = end.colIndex >= colIndex && end.colIndex <= endColIndex
  const startIsAfterDeletedRange = start.colIndex > endColIndex
  const endIsAfterDeletedRange = end.colIndex > endColIndex

  // range reference is enclosed in deleted col range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${rangeReference.toStringWithGrid()} was deleted`)
  }

  const startDeltaCol = startIsAfterDeletedRange
    ? -count
    : startIsInDeletedRange
      ? colIndex - start.colIndex
      : 0

  const endDeltaCol = endIsAfterDeletedRange
    ? -count
    : endIsInDeletedRange
      ? colIndex - end.colIndex - 1
      : 0

  const newStart = startDeltaCol
    ? cellTransformMove(
        start,
        {
          type: 'move',
          grid,
          deltaCol: startDeltaCol,
        },
      )
    : start

  const newEnd = endDeltaCol
    ? cellTransformMove(
        end,
        {
          type: 'move',
          grid,
          deltaCol: endDeltaCol,
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
