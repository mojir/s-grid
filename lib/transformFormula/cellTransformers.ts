import type { RangeLocator } from '../locator/RangeLocator'
import { CellLocator } from '../locator/CellLocator'
import type { Movement } from '../locator/utils'
import type { RowRangeLocator } from '../locator/RowRangeLocator'
import type { ColRangeLocator } from '../locator/ColRangeLocator'
import type { FormulaTransformation } from '.'

export function transformCell(cellLocatorString: string, transformation: FormulaTransformation): string {
  const cellLocator = CellLocator.fromString(cellLocatorString)
  switch (transformation.type) {
    case 'move':
      return transformMoveOnCell(cellLocator, transformation.movement, transformation.range)
    case 'rowDelete':
      return transformRowDeleteOnCell(cellLocator, transformation.rowRangeLocator)
    case 'colDelete':
      return transformColDeleteOnCell(cellLocator, transformation.colRangeLocator)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnCell(cellLocator, transformation.rowRangeLocator)
    case 'colInsertBefore':
      return transformColInsertBeforeOnCell(cellLocator, transformation.colRangeLocator)
  }
}

export function transformMoveOnCell(cellLocator: CellLocator, { cols, rows }: Movement, maskRange?: RangeLocator): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }

  if (maskRange && !maskRange.containsCell(cellLocator)) {
    return cellLocator.toString()
  }

  const rowLocator = cellLocator.absRow
    ? cellLocator.getRowLocator()
    : cellLocator.move({ rows }).getRowLocator()

  const colLocator = cellLocator.absCol
    ? cellLocator.getColLocator()
    : cellLocator.move({ cols }).getColLocator()

  return CellLocator.fromRowCol({ rowLocator, colLocator }).toString()
}

export function transformRowDeleteOnCell(cellLocator: CellLocator, rowRangeLocator: RowRangeLocator): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }
  const row = rowRangeLocator.start.row
  const count = rowRangeLocator.size()
  if (cellLocator.row >= row && cellLocator.row < row + count) {
    throw new Error(`Cell ${cellLocator.toString()} was deleted`)
  }

  if (cellLocator.row >= row + count) {
    return transformMoveOnCell(cellLocator, { cols: 0, rows: -count })
  }
  return cellLocator.toString()
}

export function transformColDeleteOnCell(cellLocator: CellLocator, colRangeLocator: ColRangeLocator): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  if (cellLocator.col >= col && cellLocator.col < col + count) {
    throw new Error(`Cell ${cellLocator.toString()} was deleted`)
  }

  if (cellLocator.col >= col + count) {
    return transformMoveOnCell(cellLocator, { cols: -count, rows: 0 })
  }
  return cellLocator.toString()
}

export function transformRowInsertBeforeOnCell(cellLocator: CellLocator, rowRangeLocator: RowRangeLocator): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }
  const row = rowRangeLocator.start.row
  const count = rowRangeLocator.size()

  if (cellLocator.row >= row) {
    return transformMoveOnCell(cellLocator, { cols: 0, rows: count })
  }
  return cellLocator.toString()
}

export function transformColInsertBeforeOnCell(cellLocator: CellLocator, colRangeLocator: ColRangeLocator): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  if (cellLocator.col >= col) {
    return transformMoveOnCell(cellLocator, { cols: count, rows: 0 })
  }
  return cellLocator.toString()
}
