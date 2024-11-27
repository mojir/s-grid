import { CellLocator } from '../locator/CellLocator'
import type {
  ColDeleteTransformation,
  ColInsertBeforeTransformation,
  FormulaTransformation,
  MoveTransformation,
  RowDeleteTransformation,
  RowInsertBeforeTransformation,
} from '.'

export function transformCellLocator({
  cellLocator,
  transformation,
}: {
  cellLocator: CellLocator
  transformation: FormulaTransformation
}): string {
  switch (transformation.type) {
    case 'move':
      return transformMoveOnCell(cellLocator, transformation)
    case 'rowDelete':
      return transformRowDeleteOnCell(cellLocator, transformation)
    case 'colDelete':
      return transformColDeleteOnCell(cellLocator, transformation)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnCell(cellLocator, transformation)
    case 'colInsertBefore':
      return transformColInsertBeforeOnCell(cellLocator, transformation)
  }
}

export function transformMoveOnCell(cellLocator: CellLocator, { movement: { cols, rows }, range, sourceGrid }: MoveTransformation): string {
  if (range && !range.containsCell(cellLocator)) {
    return cellLocator.toString(sourceGrid.name.value)
  }

  const rowLocator = cellLocator.absRow
    ? cellLocator.getRowLocator()
    : cellLocator.move({ rows }).getRowLocator()

  const colLocator = cellLocator.absCol
    ? cellLocator.getColLocator()
    : cellLocator.move({ cols }).getColLocator()

  return CellLocator.fromRowCol({ rowLocator, colLocator }).toString(sourceGrid.name.value)
}

export function transformRowDeleteOnCell(cellLocator: CellLocator, { rowRangeLocator, sourceGrid }: RowDeleteTransformation): string {
  const row = rowRangeLocator.start.row
  const count = rowRangeLocator.size()
  if (cellLocator.row >= row && cellLocator.row < row + count) {
    throw new Error(`Cell ${cellLocator.toString(sourceGrid.name.value)} was deleted`)
  }

  if (cellLocator.row >= row + count) {
    return transformMoveOnCell(cellLocator, { type: 'move', movement: { cols: 0, rows: -count }, sourceGrid })
  }
  return cellLocator.toString(sourceGrid.name.value)
}

export function transformColDeleteOnCell(cellLocator: CellLocator, { colRangeLocator, sourceGrid }: ColDeleteTransformation): string {
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  if (cellLocator.col >= col && cellLocator.col < col + count) {
    throw new Error(`Cell ${cellLocator.toString(sourceGrid.name.value)} was deleted`)
  }

  if (cellLocator.col >= col + count) {
    return transformMoveOnCell(cellLocator, { type: 'move', movement: { cols: -count, rows: 0 }, sourceGrid })
  }
  return cellLocator.toString(sourceGrid.name.value)
}

export function transformRowInsertBeforeOnCell(cellLocator: CellLocator, { rowRangeLocator, sourceGrid }: RowInsertBeforeTransformation): string {
  const row = rowRangeLocator.start.row
  const count = rowRangeLocator.size()

  if (cellLocator.row >= row) {
    return transformMoveOnCell(cellLocator, { type: 'move', movement: { cols: 0, rows: count }, sourceGrid })
  }
  return cellLocator.toString(sourceGrid.name.value)
}

export function transformColInsertBeforeOnCell(cellLocator: CellLocator, { colRangeLocator, sourceGrid }: ColInsertBeforeTransformation): string {
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  if (cellLocator.col >= col) {
    return transformMoveOnCell(cellLocator, { type: 'move', movement: { cols: count, rows: 0 }, sourceGrid })
  }
  return cellLocator.toString(sourceGrid.name.value)
}
