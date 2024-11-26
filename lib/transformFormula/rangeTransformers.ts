import { RangeLocator } from '../locator/RangeLocator'
import { CellLocator } from '../locator/CellLocator'
import type { RowRangeLocator } from '../locator/RowRangeLocator'
import type { ColRangeLocator } from '../locator/ColRangeLocator'
import type { Grid } from '../Grid'
import { transformColInsertBeforeOnCell, transformMoveOnCell, transformRowInsertBeforeOnCell } from './cellTransformers'
import type { FormulaTransformation } from '.'

export function transformRangeLocator({
  grid,
  rangeLocator,
  transformation,
}: {
  grid: Grid
  rangeLocator: RangeLocator
  transformation: FormulaTransformation
}): string {
  switch (transformation.type) {
    case 'move':
      return RangeLocator.fromCellLocators(
        CellLocator.fromString(transformMoveOnCell(grid, rangeLocator.start, transformation.movement, transformation.range)),
        CellLocator.fromString(transformMoveOnCell(grid, rangeLocator.end, transformation.movement, transformation.range)),
      ).toString()
    case 'rowDelete':
      return transformRowDeleteOnRange(grid, rangeLocator, transformation.rowRangeLocator)
    case 'colDelete':
      return transformColDeleteOnRange(grid, rangeLocator, transformation.colRangeLocator)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnRange(grid, rangeLocator, transformation.rowRangeLocator)
    case 'colInsertBefore':
      return transformColInsertBeforeOnRange(grid, rangeLocator, transformation.colRangeLocator)
  }
}

function transformRowDeleteOnRange(grid: Grid, range: RangeLocator, rowRangeLocator: RowRangeLocator): string {
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
    const newStart = transformMoveOnCell(grid, start, { cols: 0, rows: startRowToDelete - start.row })
    const newEnd = transformMoveOnCell(grid, end, { cols: 0, rows: -deleteCount })

    return `${newStart}-${newEnd}`
  }

  // range is above and intersecting deleted row range
  if (endIsInDeletedRange) {
    const newStart = start.toString()
    const newEnd = transformMoveOnCell(grid, end, { cols: 0, rows: startRowToDelete - end.row - 1 })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.row >= startRowToDelete + deleteCount
  const endIsBelowDeletedRange = end.row >= startRowToDelete + deleteCount

  const newStart: string = startIsBelowDeletedRange ? transformMoveOnCell(grid, start, { cols: 0, rows: -deleteCount }) : start.toString()
  const newEnd: string = endIsBelowDeletedRange ? transformMoveOnCell(grid, end, { cols: 0, rows: -deleteCount }) : end.toString()

  return `${newStart}-${newEnd}`
}

function transformColDeleteOnRange(grid: Grid, range: RangeLocator, colRangeLocator: ColRangeLocator): string {
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
    const newStart = transformMoveOnCell(grid, start, { cols: startColToDelete - start.col, rows: 0 })
    const newEnd = transformMoveOnCell(grid, end, { cols: -deleteCount, rows: 0 })

    return `${newStart}-${newEnd}`
  }

  // range is to the right and intersecting deleted col range
  if (endIsInDeletedRange) {
    const newStart = start.toString()
    const newEnd = transformMoveOnCell(grid, end, { cols: startColToDelete - end.col - 1, rows: 0 })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.col >= startColToDelete + deleteCount
  const endIsRightOfDeletedRange = end.col >= startColToDelete + deleteCount

  const newStart: string = startIsRightOfDeletedRange ? transformMoveOnCell(grid, start, { cols: -deleteCount, rows: 0 }) : start.toString()
  const newEnd: string = endIsRightOfDeletedRange ? transformMoveOnCell(grid, end, { cols: -deleteCount, rows: 0 }) : end.toString()

  return `${newStart}-${newEnd}`
}

function transformRowInsertBeforeOnRange(grid: Grid, { start, end }: RangeLocator, rowRangeLocator: RowRangeLocator): string {
  const newStart = transformRowInsertBeforeOnCell(grid, start, rowRangeLocator)
  const newEnd = transformRowInsertBeforeOnCell(grid, end, rowRangeLocator)
  return `${newStart}-${newEnd}`
}

function transformColInsertBeforeOnRange(grid: Grid, { start, end }: RangeLocator, colRangeLocator: ColRangeLocator): string {
  const newStart = transformColInsertBeforeOnCell(grid, start, colRangeLocator)
  const newEnd = transformColInsertBeforeOnCell(grid, end, colRangeLocator)
  return `${newStart}-${newEnd}`
}
