import { CellLocator } from '../locator/CellLocator'
import { RangeLocator } from '../locator/RangeLocator'
import { transformColInsertBeforeOnCell, transformMoveOnCell, transformRowInsertBeforeOnCell } from './cellTransformers'
import type { ColDeleteTransformation, ColInsertBeforeTransformation, FormulaTransformation, RowDeleteTransformation, RowInsertBeforeTransformation } from '.'

export function transformRangeLocator({
  rangeLocator,
  transformation,
}: {
  rangeLocator: RangeLocator
  transformation: FormulaTransformation
}): string {
  switch (transformation.type) {
    case 'move':
      return RangeLocator.fromCellLocators(
        CellLocator.fromString(transformation.sourceGrid.name.value, transformMoveOnCell(rangeLocator.start, transformation)),
        CellLocator.fromString(transformation.sourceGrid.name.value, transformMoveOnCell(rangeLocator.end, transformation)),
      ).toString(transformation.sourceGrid.name.value)
    case 'rowDelete':
      return transformRowDeleteOnRange(rangeLocator, transformation)
    case 'colDelete':
      return transformColDeleteOnRange(rangeLocator, transformation)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnRange(rangeLocator, transformation)
    case 'colInsertBefore':
      return transformColInsertBeforeOnRange(rangeLocator, transformation)
  }
}

function transformRowDeleteOnRange(range: RangeLocator, { rowRangeLocator, sourceGrid }: RowDeleteTransformation): string {
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
    const newStart = transformMoveOnCell(start, { type: 'move', movement: { cols: 0, rows: startRowToDelete - start.row }, sourceGrid })
    const newEnd = transformMoveOnCell(end, { type: 'move', movement: { cols: 0, rows: -deleteCount }, sourceGrid })

    return `${newStart}-${newEnd}`
  }

  // range is above and intersecting deleted row range
  if (endIsInDeletedRange) {
    const newStart = start.toStringWithGrid()
    const newEnd = transformMoveOnCell(end, { type: 'move', movement: { cols: 0, rows: startRowToDelete - end.row - 1 }, sourceGrid })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.row >= startRowToDelete + deleteCount
  const endIsBelowDeletedRange = end.row >= startRowToDelete + deleteCount

  const newStart: string = startIsBelowDeletedRange
    ? transformMoveOnCell(start, { type: 'move', movement: { cols: 0, rows: -deleteCount }, sourceGrid })
    : start.toStringWithGrid()
  const newEnd: string = endIsBelowDeletedRange
    ? transformMoveOnCell(end, { type: 'move', movement: { cols: 0, rows: -deleteCount }, sourceGrid })
    : end.toStringWithGrid()

  return `${newStart}-${newEnd}`
}

function transformColDeleteOnRange(range: RangeLocator, { colRangeLocator, sourceGrid }: ColDeleteTransformation): string {
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
    const newStart = transformMoveOnCell(start, { type: 'move', movement: { cols: startColToDelete - start.col, rows: 0 }, sourceGrid })
    const newEnd = transformMoveOnCell(end, { type: 'move', movement: { cols: -deleteCount, rows: 0 }, sourceGrid })

    return `${newStart}-${newEnd}`
  }

  // range is to the right and intersecting deleted col range
  if (endIsInDeletedRange) {
    const newStart = start.toStringWithGrid()
    const newEnd = transformMoveOnCell(end, { type: 'move', movement: { cols: startColToDelete - end.col - 1, rows: 0 }, sourceGrid })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.col >= startColToDelete + deleteCount
  const endIsRightOfDeletedRange = end.col >= startColToDelete + deleteCount

  const newStart: string = startIsRightOfDeletedRange ? transformMoveOnCell(start, { type: 'move', movement: { cols: -deleteCount, rows: 0 }, sourceGrid }) : start.toStringWithGrid()
  const newEnd: string = endIsRightOfDeletedRange ? transformMoveOnCell(end, { type: 'move', movement: { cols: -deleteCount, rows: 0 }, sourceGrid }) : end.toStringWithGrid()

  return `${newStart}-${newEnd}`
}

function transformRowInsertBeforeOnRange({ start, end }: RangeLocator, transformation: RowInsertBeforeTransformation): string {
  const newStart = transformRowInsertBeforeOnCell(start, transformation)
  const newEnd = transformRowInsertBeforeOnCell(end, transformation)
  return `${newStart}-${newEnd}`
}

function transformColInsertBeforeOnRange({ start, end }: RangeLocator, transformation: ColInsertBeforeTransformation): string {
  const newStart = transformColInsertBeforeOnCell(start, transformation)
  const newEnd = transformColInsertBeforeOnCell(end, transformation)
  return `${newStart}-${newEnd}`
}
