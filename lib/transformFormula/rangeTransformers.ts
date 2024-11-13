import { getInfoFromCellIdString, type CellIdStringInfo } from '../CellId'
import type { RowRange } from '../Row'
import type { ColRange } from '../Col'
import { transformMoveOnCell } from './cellTransformers'
import type { FormulaTransformation } from '.'

type RangeInfo = {
  start: CellIdStringInfo
  end: CellIdStringInfo
  id: string
}

function getRangeInfo(rangeIdString: string): RangeInfo {
  const [start, end] = rangeIdString.split('-').map(getInfoFromCellIdString)
  return {
    start,
    end,
    id: rangeIdString,
  }
}

export function transformRange(rangeIdString: string, transformation: FormulaTransformation): string {
  const rangeInfo: RangeInfo = getRangeInfo(rangeIdString)
  switch (transformation.type) {
    case 'move':
      return rangeIdString.split('-').map(cellIdString =>
        transformMoveOnCell(getInfoFromCellIdString(cellIdString), transformation.movement)).join('-')
    case 'rowDelete':
      return transformRowDeleteOnRange(rangeInfo, transformation.rowRange)
    case 'colDelete':
      return transformColDeleteOnRange(rangeInfo, transformation.colRange)
  }
}

function transformRowDeleteOnRange({ start, end, id }: RangeInfo, { rowIndex: startRowIndexToDelete, count: deleteCount }: RowRange): string {
  const startIsInDeletedRange
    = start.rowIndex >= startRowIndexToDelete
    && start.rowIndex < startRowIndexToDelete + deleteCount

  const endIsInDeletedRange
    = end.rowIndex >= startRowIndexToDelete
    && end.rowIndex < startRowIndexToDelete + deleteCount

  // range reference is enclosed in deleted row range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${id} was deleted`)
  }

  // range reference is below and intersecting deleted row range
  if (startIsInDeletedRange) {
    const newStart = transformMoveOnCell(start, { cols: 0, rows: startRowIndexToDelete - start.rowIndex })
    const newEnd = transformMoveOnCell(end, { cols: 0, rows: -deleteCount })

    return `${newStart}-${newEnd}`
  }

  // range is above and intersecting deleted row range
  if (endIsInDeletedRange) {
    const newStart = start.id
    const newEnd = transformMoveOnCell(end, { cols: 0, rows: startRowIndexToDelete - end.rowIndex - 1 })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted row range

  const startIsBelowDeletedRange = start.rowIndex >= startRowIndexToDelete + deleteCount
  const endIsBelowDeletedRange = end.rowIndex >= startRowIndexToDelete + deleteCount

  const newStart: string = startIsBelowDeletedRange ? transformMoveOnCell(start, { cols: 0, rows: -deleteCount }) : start.id
  const newEnd: string = endIsBelowDeletedRange ? transformMoveOnCell(end, { cols: 0, rows: -deleteCount }) : end.id

  return `${newStart}-${newEnd}`
}

function transformColDeleteOnRange({ start, end, id }: RangeInfo, { colIndex: startColIndexToDelete, count: deleteCount }: ColRange): string {
  const startIsInDeletedRange
    = start.colIndex >= startColIndexToDelete
    && start.colIndex < startColIndexToDelete + deleteCount

  const endIsInDeletedRange
    = end.colIndex >= startColIndexToDelete
    && end.colIndex < startColIndexToDelete + deleteCount

  // range reference is enclosed in deleted col range
  if (startIsInDeletedRange && endIsInDeletedRange) {
    throw new Error(`Range ${id} was deleted`)
  }

  // range reference is to the right and intersecting deleted col range
  if (startIsInDeletedRange) {
    const newStart = transformMoveOnCell(start, { cols: startColIndexToDelete - start.colIndex, rows: 0 })
    const newEnd = transformMoveOnCell(end, { cols: -deleteCount, rows: 0 })

    return `${newStart}-${newEnd}`
  }

  // range is to the right and intersecting deleted col range
  if (endIsInDeletedRange) {
    const newStart = start.id
    const newEnd = transformMoveOnCell(end, { cols: startColIndexToDelete - end.colIndex - 1, rows: 0 })

    return `${newStart}-${newEnd}`
  }

  // no range reference endpoints (start-end) are inside deleted col range

  const startIsRightOfDeletedRange = start.colIndex >= startColIndexToDelete + deleteCount
  const endIsRightOfDeletedRange = end.colIndex >= startColIndexToDelete + deleteCount

  const newStart: string = startIsRightOfDeletedRange ? transformMoveOnCell(start, { cols: -deleteCount, rows: 0 }) : start.id
  const newEnd: string = endIsRightOfDeletedRange ? transformMoveOnCell(end, { cols: -deleteCount, rows: 0 }) : end.id

  return `${newStart}-${newEnd}`
}
