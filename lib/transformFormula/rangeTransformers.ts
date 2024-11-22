import { RangeLocator } from '../locator/RangeLocator'
import { CellLocator } from '../locator/CellLocator'
import type { RowRange } from '../locator/RowLocator'
import type { ColRange } from '../locator/ColLocator'
import { transformColInsertBeforeOnCell, transformMoveOnCell, transformRowInsertBeforeOnCell } from './cellTransformers'
import type { FormulaTransformation } from '.'

export function transformRange(rangeLocatorString: string, transformation: FormulaTransformation): string {
  const rangeLocator = RangeLocator.fromString(rangeLocatorString)
  switch (transformation.type) {
    case 'move':
      return RangeLocator.fromCellLocators(
        CellLocator.fromString(transformMoveOnCell(rangeLocator.start, transformation.movement)),
        CellLocator.fromString(transformMoveOnCell(rangeLocator.end, transformation.movement)),
      ).toString()
    case 'rowDelete':
      return transformRowDeleteOnRange(rangeLocator, transformation.rowRange)
    case 'colDelete':
      return transformColDeleteOnRange(rangeLocator, transformation.colRange)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnRange(rangeLocator, transformation.rowRange)
    case 'colInsertBefore':
      return transformColInsertBeforeOnRange(rangeLocator, transformation.colRange)
  }
}

function transformRowDeleteOnRange(range: RangeLocator, { row: startRowIndexToDelete, count: deleteCount }: RowRange): string {
  const { start, end } = range
  const startIsInDeletedRange
    = start.row >= startRowIndexToDelete
    && start.row < startRowIndexToDelete + deleteCount

  const endIsInDeletedRange
    = end.row >= startRowIndexToDelete
    && end.row < startRowIndexToDelete + deleteCount

  // range reference is enclosed in deleted row range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${range.toString()} was deleted`)
  }

  // range reference is below and intersecting deleted row range
  if (startIsInDeletedRange) {
    const newStart = transformMoveOnCell(start, { cols: 0, rows: startRowIndexToDelete - start.row })
    const newEnd = transformMoveOnCell(end, { cols: 0, rows: -deleteCount })

    return `${newStart}-${newEnd}`
  }

  // range is above and intersecting deleted row range
  if (endIsInDeletedRange) {
    const newStart = start.toString()
    const newEnd = transformMoveOnCell(end, { cols: 0, rows: startRowIndexToDelete - end.row - 1 })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.row >= startRowIndexToDelete + deleteCount
  const endIsBelowDeletedRange = end.row >= startRowIndexToDelete + deleteCount

  const newStart: string = startIsBelowDeletedRange ? transformMoveOnCell(start, { cols: 0, rows: -deleteCount }) : start.toString()
  const newEnd: string = endIsBelowDeletedRange ? transformMoveOnCell(end, { cols: 0, rows: -deleteCount }) : end.toString()

  return `${newStart}-${newEnd}`
}

function transformColDeleteOnRange(range: RangeLocator, { col: startColIndexToDelete, count: deleteCount }: ColRange): string {
  const { start, end } = range

  const startIsInDeletedRange
    = start.col >= startColIndexToDelete
    && start.col < startColIndexToDelete + deleteCount

  const endIsInDeletedRange
    = end.col >= startColIndexToDelete
    && end.col < startColIndexToDelete + deleteCount

  // range reference is enclosed in deleted col range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${range.toString()} was deleted`)
  }

  // range reference is to the right and intersecting deleted col range
  if (startIsInDeletedRange) {
    const newStart = transformMoveOnCell(start, { cols: startColIndexToDelete - start.col, rows: 0 })
    const newEnd = transformMoveOnCell(end, { cols: -deleteCount, rows: 0 })

    return `${newStart}-${newEnd}`
  }

  // range is to the right and intersecting deleted col range
  if (endIsInDeletedRange) {
    const newStart = start.toString()
    const newEnd = transformMoveOnCell(end, { cols: startColIndexToDelete - end.col - 1, rows: 0 })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.col >= startColIndexToDelete + deleteCount
  const endIsRightOfDeletedRange = end.col >= startColIndexToDelete + deleteCount

  const newStart: string = startIsRightOfDeletedRange ? transformMoveOnCell(start, { cols: -deleteCount, rows: 0 }) : start.toString()
  const newEnd: string = endIsRightOfDeletedRange ? transformMoveOnCell(end, { cols: -deleteCount, rows: 0 }) : end.toString()

  return `${newStart}-${newEnd}`
}

function transformRowInsertBeforeOnRange({ start, end }: RangeLocator, { row: startRowIndexToDelete, count: deleteCount }: RowRange): string {
  const newStart = transformRowInsertBeforeOnCell(start, { row: startRowIndexToDelete, count: deleteCount })
  const newEnd = transformRowInsertBeforeOnCell(end, { row: startRowIndexToDelete, count: deleteCount })
  return `${newStart}-${newEnd}`
}

function transformColInsertBeforeOnRange({ start, end }: RangeLocator, { col: startColIndexToDelete, count: deleteCount }: ColRange): string {
  const newStart = transformColInsertBeforeOnCell(start, { col: startColIndexToDelete, count: deleteCount })
  const newEnd = transformColInsertBeforeOnCell(end, { col: startColIndexToDelete, count: deleteCount })
  return `${newStart}-${newEnd}`
}
