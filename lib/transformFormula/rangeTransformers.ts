import { RangeLocator } from '../locator/RangeLocator'
import { CellLocator } from '../locator/CellLocator'
import type { RowRangeLocator } from '../locator/RowRangeLocator'
import type { ColRangeLocator } from '../locator/ColRangeLocator'
import { transformColInsertBeforeOnCell, transformMoveOnCell, transformRowInsertBeforeOnCell } from './cellTransformers'
import type { FormulaTransformation } from '.'

export function transformRange(rangeLocatorString: string, transformation: FormulaTransformation): string {
  const rangeLocator = RangeLocator.fromString(rangeLocatorString)
  switch (transformation.type) {
    case 'move':
      return RangeLocator.fromCellLocators(
        CellLocator.fromString(transformMoveOnCell(rangeLocator.start, transformation.movement, transformation.range)),
        CellLocator.fromString(transformMoveOnCell(rangeLocator.end, transformation.movement, transformation.range)),
      ).toString()
    case 'rowDelete':
      return transformRowDeleteOnRange(rangeLocator, transformation.rowRangeLocator)
    case 'colDelete':
      return transformColDeleteOnRange(rangeLocator, transformation.colRangeLocator)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnRange(rangeLocator, transformation.rowRangeLocator)
    case 'colInsertBefore':
      return transformColInsertBeforeOnRange(rangeLocator, transformation.colRangeLocator)
  }
}

function transformRowDeleteOnRange(range: RangeLocator, rowRangeLocator: RowRangeLocator): string {
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
    throw new Error(`Range ${range.toString()} was deleted`)
  }

  // range reference is below and intersecting deleted row range
  if (startIsInDeletedRange) {
    const newStart = transformMoveOnCell(start, { cols: 0, rows: startRowToDelete - start.row })
    const newEnd = transformMoveOnCell(end, { cols: 0, rows: -deleteCount })

    return `${newStart}-${newEnd}`
  }

  // range is above and intersecting deleted row range
  if (endIsInDeletedRange) {
    const newStart = start.toString()
    const newEnd = transformMoveOnCell(end, { cols: 0, rows: startRowToDelete - end.row - 1 })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.row >= startRowToDelete + deleteCount
  const endIsBelowDeletedRange = end.row >= startRowToDelete + deleteCount

  const newStart: string = startIsBelowDeletedRange ? transformMoveOnCell(start, { cols: 0, rows: -deleteCount }) : start.toString()
  const newEnd: string = endIsBelowDeletedRange ? transformMoveOnCell(end, { cols: 0, rows: -deleteCount }) : end.toString()

  return `${newStart}-${newEnd}`
}

function transformColDeleteOnRange(range: RangeLocator, colRangeLocator: ColRangeLocator): string {
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
    throw new Error(`Range ${range.toString()} was deleted`)
  }

  // range reference is to the right and intersecting deleted col range
  if (startIsInDeletedRange) {
    const newStart = transformMoveOnCell(start, { cols: startColToDelete - start.col, rows: 0 })
    const newEnd = transformMoveOnCell(end, { cols: -deleteCount, rows: 0 })

    return `${newStart}-${newEnd}`
  }

  // range is to the right and intersecting deleted col range
  if (endIsInDeletedRange) {
    const newStart = start.toString()
    const newEnd = transformMoveOnCell(end, { cols: startColToDelete - end.col - 1, rows: 0 })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.col >= startColToDelete + deleteCount
  const endIsRightOfDeletedRange = end.col >= startColToDelete + deleteCount

  const newStart: string = startIsRightOfDeletedRange ? transformMoveOnCell(start, { cols: -deleteCount, rows: 0 }) : start.toString()
  const newEnd: string = endIsRightOfDeletedRange ? transformMoveOnCell(end, { cols: -deleteCount, rows: 0 }) : end.toString()

  return `${newStart}-${newEnd}`
}

function transformRowInsertBeforeOnRange({ start, end }: RangeLocator, rowRangeLocator: RowRangeLocator): string {
  const newStart = transformRowInsertBeforeOnCell(start, rowRangeLocator)
  const newEnd = transformRowInsertBeforeOnCell(end, rowRangeLocator)
  return `${newStart}-${newEnd}`
}

function transformColInsertBeforeOnRange({ start, end }: RangeLocator, colRangeLocator: ColRangeLocator): string {
  const newStart = transformColInsertBeforeOnCell(start, colRangeLocator)
  const newEnd = transformColInsertBeforeOnCell(end, colRangeLocator)
  return `${newStart}-${newEnd}`
}
