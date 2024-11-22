import type { RangeLocator } from '../locator/RangeLocator'
import { CellLocator } from '../locator/CellLocator'
import type { Movement } from '../locator/utils'
import type { RowRange } from '../locator/RowLocator'
import type { ColRange } from '../locator/ColLocator'
import type { FormulaTransformation } from '.'

export function transformCell(cellLocatorString: string, transformation: FormulaTransformation): string {
  const cellLocator = CellLocator.fromString(cellLocatorString)
  switch (transformation.type) {
    case 'move':
      return transformMoveOnCell(cellLocator, transformation.movement, transformation.range)
    case 'rowDelete':
      return transformRowDeleteOnCell(cellLocator, transformation.rowRange)
    case 'colDelete':
      return transformColDeleteOnCell(cellLocator, transformation.colRange)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnCell(cellLocator, transformation.rowRange)
    case 'colInsertBefore':
      return transformColInsertBeforeOnCell(cellLocator, transformation.colRange)
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

export function transformRowDeleteOnCell(cellLocator: CellLocator, { row, count }: RowRange): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }
  if (cellLocator.row >= row && cellLocator.row < row + count) {
    throw new Error(`Cell ${cellLocator.toString()} was deleted`)
  }

  if (cellLocator.row >= row + count) {
    return transformMoveOnCell(cellLocator, { cols: 0, rows: -count })
  }
  return cellLocator.toString()
}

export function transformColDeleteOnCell(cellLocator: CellLocator, { col, count }: ColRange): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }
  if (cellLocator.col >= col && cellLocator.col < col + count) {
    throw new Error(`Cell ${cellLocator.toString()} was deleted`)
  }

  if (cellLocator.col >= col + count) {
    return transformMoveOnCell(cellLocator, { cols: -count, rows: 0 })
  }
  return cellLocator.toString()
}

export function transformRowInsertBeforeOnCell(cellLocator: CellLocator, { row, count }: RowRange): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }
  if (cellLocator.row >= row) {
    return transformMoveOnCell(cellLocator, { cols: 0, rows: count })
  }
  return cellLocator.toString()
}

export function transformColInsertBeforeOnCell(cellLocator: CellLocator, { col, count }: ColRange): string {
  if (cellLocator.externalGrid) {
    return cellLocator.toString()
  }
  if (cellLocator.col >= col) {
    return transformMoveOnCell(cellLocator, { cols: count, rows: 0 })
  }
  return cellLocator.toString()
}
