import { getInfoFromCellIdString, CellId, type CellIdStringInfo } from '../CellId'
import { Col } from '../Col'
import type { RowRange } from '../Row'
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
  }
}

function transformRowDeleteOnRange({ start, end, id }: RangeInfo, { rowIndex, count }: RowRange): string {
  const startCol = Col.getColIndexFromId(start.colId)
  const endCol = Col.getColIndexFromId(end.colId)

  const startInDeletedRange = start.rowIndex >= rowIndex && start.rowIndex < rowIndex + count
  const endInDeletedRange = end.rowIndex >= rowIndex && end.rowIndex < rowIndex + count

  // range is in deleted row range
  if (startInDeletedRange && endInDeletedRange) {
    throw new Error(`Range ${id} was deleted`)
  }

  // TODO use transformMoveOnCell, this takes care of absolute references
  // range is below and intersecting deleted row range
  if (startInDeletedRange) {
    return CellId.fromCoords(rowIndex + count, startCol).id + '-' + end.id
  }

  // TODO use transformMoveOnCell, this takes care of absolute references
  // range is above and intersecting deleted row range
  if (endInDeletedRange) {
    return `${start.id}-${CellId.fromCoords(rowIndex - 1, endCol).id}`
  }

  const startBelowDeletedRange = start.rowIndex >= rowIndex + count
  const endBelowDeletedRange = end.rowIndex >= rowIndex + count

  const newStart: string = startBelowDeletedRange ? transformMoveOnCell(start, { cols: 0, rows: -count }) : start.id
  const newEnd: string = endBelowDeletedRange ? transformMoveOnCell(end, { cols: 0, rows: -count }) : end.id

  return `${newStart}-${newEnd}`
}
