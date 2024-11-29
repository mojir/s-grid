import { CellLocator } from '../locator/CellLocator'
import { RangeLocator } from '../locator/RangeLocator'
import { transformColInsertBeforeOnCell, transformMoveOnCell, transformRowInsertBeforeOnCell } from './cellTransformers'
import type { ColDeleteTransformation, ColInsertBeforeTransformation, FormulaTransformation, RowDeleteTransformation, RowInsertBeforeTransformation } from '.'

export function transformRangeLocator({
  cellGrid,
  rangeLocator,
  transformation,
}: {
  cellGrid: string
  rangeLocator: RangeLocator
  transformation: FormulaTransformation
}): string {
  switch (transformation.type) {
    case 'move':
      return RangeLocator.fromCellLocators(
        CellLocator.fromString(cellGrid, transformMoveOnCell(cellGrid, rangeLocator.start, transformation)),
        CellLocator.fromString(cellGrid, transformMoveOnCell(cellGrid, rangeLocator.end, transformation)),
      ).toString(cellGrid)
    case 'rowDelete':
      return transformRowDeleteOnRange(cellGrid, rangeLocator, transformation)
    case 'colDelete':
      return transformColDeleteOnRange(cellGrid, rangeLocator, transformation)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnRange(cellGrid, rangeLocator, transformation)
    case 'colInsertBefore':
      return transformColInsertBeforeOnRange(cellGrid, rangeLocator, transformation)
  }
}

function transformRowDeleteOnRange(cellGrid: string, range: RangeLocator, { rowRangeLocator, sourceGrid }: RowDeleteTransformation): string {
  const startRowToDelete = rowRangeLocator.start.row
  const deleteCount = rowRangeLocator.size()
  const { start, end } = range
  const startIsInDeletedRange
    = start.row >= startRowToDelete
    && start.row < startRowToDelete + deleteCount

  const endIsInDeletedRange
    = end.row >= startRowToDelete
    && end.row < startRowToDelete + deleteCount

  // range reference is enclosed in deleted row range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${range.toStringWithGrid()} was deleted`)
  }

  // range reference is below and intersecting deleted row range
  if (startIsInDeletedRange) {
    const newStart = transformMoveOnCell(
      cellGrid,
      start,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: startRowToDelete - start.row,
        },
      })
    const newEnd = transformMoveOnCell(
      cellGrid,
      end,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: -deleteCount,
        },
      },
    )

    return `${newStart}-${newEnd}`
  }

  // range is above and intersecting deleted row range
  if (endIsInDeletedRange) {
    const newStart = start.toStringWithGrid()
    const newEnd = transformMoveOnCell(
      cellGrid,
      end,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: startRowToDelete - end.row - 1,
        },
      },
    )

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.row >= startRowToDelete + deleteCount
  const endIsBelowDeletedRange = end.row >= startRowToDelete + deleteCount

  const newStart: string = startIsBelowDeletedRange
    ? transformMoveOnCell(
      cellGrid,
      start,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: -deleteCount,
        },
      },
    )
    : start.toStringWithGrid()
  const newEnd: string = endIsBelowDeletedRange
    ? transformMoveOnCell(
      cellGrid,
      end,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: -deleteCount,
        },
      },
    )
    : end.toStringWithGrid()

  return `${newStart}-${newEnd}`
}

function transformColDeleteOnRange(cellGrid: string, range: RangeLocator, { colRangeLocator, sourceGrid }: ColDeleteTransformation): string {
  const { start, end } = range

  const startColToDelete = colRangeLocator.start.col
  const deleteCount = colRangeLocator.size()

  const startIsInDeletedRange
    = start.col >= startColToDelete
    && start.col < startColToDelete + deleteCount

  const endIsInDeletedRange
    = end.col >= startColToDelete
    && end.col < startColToDelete + deleteCount

  // range reference is enclosed in deleted col range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${range.toStringWithGrid()} was deleted`)
  }

  // range reference is to the right and intersecting deleted col range
  if (startIsInDeletedRange) {
    const newStart = transformMoveOnCell(
      cellGrid,
      start,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: startColToDelete - start.col,
          deltaRow: 0,
        },
      },
    )
    const newEnd = transformMoveOnCell(
      cellGrid,
      end,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: -deleteCount,
          deltaRow: 0,
        },
      },
    )

    return `${newStart}-${newEnd}`
  }

  // range is to the right and intersecting deleted col range
  if (endIsInDeletedRange) {
    const newStart = start.toStringWithGrid()
    const newEnd = transformMoveOnCell(
      cellGrid,
      end,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: startColToDelete - end.col - 1,
          deltaRow: 0,
        },
      },
    )

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.col >= startColToDelete + deleteCount
  const endIsRightOfDeletedRange = end.col >= startColToDelete + deleteCount

  const newStart: string = startIsRightOfDeletedRange
    ? transformMoveOnCell(
      cellGrid,
      start,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: -deleteCount,
          deltaRow: 0,
        },
      },
    )
    : start.toStringWithGrid()
  const newEnd: string = endIsRightOfDeletedRange
    ? transformMoveOnCell(
      cellGrid,
      end,
      {
        type: 'move',
        sourceGrid,
        movement: {
          toGrid: cellGrid,
          deltaCol: -deleteCount,
          deltaRow: 0,
        },
      },
    )
    : end.toStringWithGrid()

  return `${newStart}-${newEnd}`
}

function transformRowInsertBeforeOnRange(cellGrid: string, { start, end }: RangeLocator, transformation: RowInsertBeforeTransformation): string {
  const newStart = transformRowInsertBeforeOnCell(cellGrid, start, transformation)
  const newEnd = transformRowInsertBeforeOnCell(cellGrid, end, transformation)
  return `${newStart}-${newEnd}`
}

function transformColInsertBeforeOnRange(cellGrid: string, { start, end }: RangeLocator, transformation: ColInsertBeforeTransformation): string {
  const newStart = transformColInsertBeforeOnCell(cellGrid, start, transformation)
  const newEnd = transformColInsertBeforeOnCell(cellGrid, end, transformation)
  return `${newStart}-${newEnd}`
}
