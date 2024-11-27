import type { RangeLocator } from '../locator/RangeLocator'
import { CellLocator } from '../locator/CellLocator'
import type { Movement } from '../locator/utils'
import type { RowRangeLocator } from '../locator/RowRangeLocator'
import type { ColRangeLocator } from '../locator/ColRangeLocator'
import type { Grid } from '../Grid'
import type { FormulaTransformation } from '.'

export function transformCellLocator({
  grid,
  cellLocator,
  transformation,
}: {
  grid: Grid
  cellLocator: CellLocator
  transformation: FormulaTransformation
}): string {
  switch (transformation.type) {
    case 'move':
      return transformMoveOnCell(grid, cellLocator, transformation.movement, transformation.range)
    case 'rowDelete':
      return transformRowDeleteOnCell(grid, cellLocator, transformation.rowRangeLocator)
    case 'colDelete':
      return transformColDeleteOnCell(grid, cellLocator, transformation.colRangeLocator)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnCell(grid, cellLocator, transformation.rowRangeLocator)
    case 'colInsertBefore':
      return transformColInsertBeforeOnCell(grid, cellLocator, transformation.colRangeLocator)
  }
}

export function transformMoveOnCell(grid: Grid, cellLocator: CellLocator, { cols, rows }: Movement, maskRange?: RangeLocator): string {
  if (maskRange && !maskRange.containsCell(cellLocator)) {
    return cellLocator.toString(grid.name.value)
  }

  const rowLocator = cellLocator.absRow
    ? cellLocator.getRowLocator()
    : cellLocator.move({ rows }).getRowLocator()

  const colLocator = cellLocator.absCol
    ? cellLocator.getColLocator()
    : cellLocator.move({ cols }).getColLocator()

  return CellLocator.fromRowCol({ rowLocator, colLocator }).toString(grid.name.value)
}

export function transformRowDeleteOnCell(grid: Grid, cellLocator: CellLocator, rowRangeLocator: RowRangeLocator): string {
  const row = rowRangeLocator.start.row
  const count = rowRangeLocator.size()
  if (cellLocator.row >= row && cellLocator.row < row + count) {
    throw new Error(`Cell ${cellLocator.toString(grid.name.value)} was deleted`)
  }

  if (cellLocator.row >= row + count) {
    return transformMoveOnCell(grid, cellLocator, { cols: 0, rows: -count })
  }
  return cellLocator.toString(grid.name.value)
}

export function transformColDeleteOnCell(grid: Grid, cellLocator: CellLocator, colRangeLocator: ColRangeLocator): string {
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  if (cellLocator.col >= col && cellLocator.col < col + count) {
    throw new Error(`Cell ${cellLocator.toString(grid.name.value)} was deleted`)
  }

  if (cellLocator.col >= col + count) {
    return transformMoveOnCell(grid, cellLocator, { cols: -count, rows: 0 })
  }
  return cellLocator.toString(grid.name.value)
}

export function transformRowInsertBeforeOnCell(grid: Grid, cellLocator: CellLocator, rowRangeLocator: RowRangeLocator): string {
  const row = rowRangeLocator.start.row
  const count = rowRangeLocator.size()

  if (cellLocator.row >= row) {
    return transformMoveOnCell(grid, cellLocator, { cols: 0, rows: count })
  }
  return cellLocator.toString(grid.name.value)
}

export function transformColInsertBeforeOnCell(grid: Grid, cellLocator: CellLocator, colRangeLocator: ColRangeLocator): string {
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  if (cellLocator.col >= col) {
    return transformMoveOnCell(grid, cellLocator, { cols: count, rows: 0 })
  }
  return cellLocator.toString(grid.name.value)
}
