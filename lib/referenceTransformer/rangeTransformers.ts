import { CellReference } from '../reference/CellReference'
import { RangeReference } from '../reference/RangeReference'
import type { Grid } from '../grid/Grid'
import { cellTransformColInsertBefore, cellTransformMove, cellTransformRowInsertBefore } from './cellReferenceTransformer'
import type { ColDeleteTransformation, ColInsertBeforeTransformation, FormulaTransformation, RowDeleteTransformation, RowInsertBeforeTransformation } from '.'

export function transformRangeReference({
  cellGrid,
  rangeReference,
  transformation,
}: {
  cellGrid: Grid
  rangeReference: RangeReference
  transformation: FormulaTransformation
}): string {
  switch (transformation.type) {
    case 'move':
      return RangeReference.fromCellReferences(
        CellReference.fromString(cellGrid, cellTransformMove(cellGrid, rangeReference.start, transformation)),
        CellReference.fromString(cellGrid, cellTransformMove(cellGrid, rangeReference.end, transformation)),
      ).toString(cellGrid)
    case 'rowDelete':
      return rangeTransformRowDelete(cellGrid, rangeReference, transformation)
    case 'colDelete':
      return rangeTransformColDelete(cellGrid, rangeReference, transformation)
    case 'rowInsertBefore':
      return rangeTransformRowInsertBefore(cellGrid, rangeReference, transformation)
    case 'colInsertBefore':
      return rangeTransformColInsertBefore(cellGrid, rangeReference, transformation)
    case 'gridDelete':
    case 'renameGrid':
      throw new Error('Should have been handled')
  }
}

function rangeTransformRowDelete(cellGrid: Grid, range: RangeReference, { row, count, sourceGrid }: RowDeleteTransformation): string {
  const { start, end } = range
  const startIsInDeletedRange
    = start.row >= row
    && start.row < row + count

  const endIsInDeletedRange
    = end.row >= row
    && end.row < row + count

  // range reference is enclosed in deleted row range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${range.toStringWithGrid()} was deleted`)
  }

  // range reference is below and intersecting deleted row range
  if (startIsInDeletedRange) {
    const newStart = cellTransformMove(
      cellGrid,
      start,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: row - start.row,
        },
      })
    const newEnd = cellTransformMove(
      cellGrid,
      end,
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

    return `${newStart}-${newEnd}`
  }

  // range is above and intersecting deleted row range
  if (endIsInDeletedRange) {
    const newStart = start.toStringWithGrid()
    const newEnd = cellTransformMove(
      cellGrid,
      end,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: row - end.row - 1,
        },
      },
    )

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.row >= row + count
  const endIsBelowDeletedRange = end.row >= row + count

  const newStart: string = startIsBelowDeletedRange
    ? cellTransformMove(
        cellGrid,
        start,
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
    : start.toStringWithGrid()
  const newEnd: string = endIsBelowDeletedRange
    ? cellTransformMove(
        cellGrid,
        end,
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
    : end.toStringWithGrid()

  return `${newStart}-${newEnd}`
}

function rangeTransformColDelete(cellGrid: Grid, range: RangeReference, { col, count, sourceGrid }: ColDeleteTransformation): string {
  const { start, end } = range

  const startIsInDeletedRange
    = start.col >= col
    && start.col < col + count

  const endIsInDeletedRange
    = end.col >= col
    && end.col < col + count

  // range reference is enclosed in deleted col range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${range.toStringWithGrid()} was deleted`)
  }

  // range reference is to the right and intersecting deleted col range
  if (startIsInDeletedRange) {
    const newStart = cellTransformMove(
      cellGrid,
      start,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: col - start.col,
          deltaRow: 0,
        },
      },
    )
    const newEnd = cellTransformMove(
      cellGrid,
      end,
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

    return `${newStart}-${newEnd}`
  }

  // range is to the right and intersecting deleted col range
  if (endIsInDeletedRange) {
    const newStart = start.toStringWithGrid()
    const newEnd = cellTransformMove(
      cellGrid,
      end,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: col - end.col - 1,
          deltaRow: 0,
        },
      },
    )

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.col >= col + count
  const endIsRightOfDeletedRange = end.col >= col + count

  const newStart: string = startIsRightOfDeletedRange
    ? cellTransformMove(
        cellGrid,
        start,
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
    : start.toStringWithGrid()
  const newEnd: string = endIsRightOfDeletedRange
    ? cellTransformMove(
        cellGrid,
        end,
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
    : end.toStringWithGrid()

  return `${newStart}-${newEnd}`
}

function rangeTransformRowInsertBefore(cellGrid: Grid, { start, end }: RangeReference, transformation: RowInsertBeforeTransformation): string {
  const newStart = cellTransformRowInsertBefore(cellGrid, start, transformation)
  const newEnd = cellTransformRowInsertBefore(cellGrid, end, transformation)
  return `${newStart}-${newEnd}`
}

function rangeTransformColInsertBefore(cellGrid: Grid, { start, end }: RangeReference, transformation: ColInsertBeforeTransformation): string {
  const newStart = cellTransformColInsertBefore(cellGrid, start, transformation)
  const newEnd = cellTransformColInsertBefore(cellGrid, end, transformation)
  return `${newStart}-${newEnd}`
}
