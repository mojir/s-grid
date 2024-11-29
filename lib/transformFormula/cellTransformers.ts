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
  cellGrid,
  cellLocator,
  transformation,
}: {
  cellGrid: string
  cellLocator: CellLocator
  transformation: FormulaTransformation
}): string {
  switch (transformation.type) {
    case 'move':
      return transformMoveOnCell(cellGrid, cellLocator, transformation)
    case 'rowDelete':
      return transformRowDeleteOnCell(cellGrid, cellLocator, transformation)
    case 'colDelete':
      return transformColDeleteOnCell(cellGrid, cellLocator, transformation)
    case 'rowInsertBefore':
      return transformRowInsertBeforeOnCell(cellGrid, cellLocator, transformation)
    case 'colInsertBefore':
      return transformColInsertBeforeOnCell(cellGrid, cellLocator, transformation)
  }
}

export function transformMoveOnCell(cellGrid: string, cellLocator: CellLocator, { movement: { fromGrid, toGrid, deltaCol: cols, deltaRow: rows }, range }: MoveTransformation): string {
  if (range && !range.containsCell(cellLocator)) {
    return cellLocator.toString(cellGrid)
  }

  const rowLocator = cellLocator.absRow
    ? cellLocator.getRowLocator()
    : cellLocator.move(
      {
        fromGrid,
        toGrid,
        deltaRow: rows,
      },
    ).getRowLocator()

  const colLocator = cellLocator.absCol
    ? cellLocator.getColLocator()
    : cellLocator.move(
      {
        fromGrid,
        toGrid,
        deltaCol: cols,
      },
    ).getColLocator()

  return CellLocator.fromRowCol({ rowLocator, colLocator }).toString(cellGrid)
}

export function transformRowDeleteOnCell(cellGrid: string, cellLocator: CellLocator, { rowRangeLocator, sourceGrid }: RowDeleteTransformation): string {
  const row = rowRangeLocator.start.row
  const count = rowRangeLocator.size()
  if (cellLocator.row >= row && cellLocator.row < row + count) {
    throw new Error(`Cell ${cellLocator.toString(cellGrid)} was deleted`)
  }

  if (cellLocator.row >= row + count) {
    return transformMoveOnCell(
      cellGrid,
      cellLocator,
      {
        type: 'move',
        sourceGrid,
        movement: {
          fromGrid: cellGrid,
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: -count,
        },
      },
    )
  }
  return cellLocator.toString(cellGrid)
}

export function transformColDeleteOnCell(cellGrid: string, cellLocator: CellLocator, { colRangeLocator, sourceGrid }: ColDeleteTransformation): string {
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  if (cellLocator.col >= col && cellLocator.col < col + count) {
    throw new Error(`Cell ${cellLocator.toString(cellGrid)} was deleted`)
  }

  if (cellLocator.col >= col + count) {
    return transformMoveOnCell(
      cellGrid,
      cellLocator,
      {
        type: 'move',
        sourceGrid,
        movement: {
          fromGrid: cellGrid,
          toGrid: cellGrid,
          deltaCol: -count,
          deltaRow: 0,
        },
      },
    )
  }
  return cellLocator.toString(cellGrid)
}

export function transformRowInsertBeforeOnCell(cellGrid: string, cellLocator: CellLocator, { rowRangeLocator, sourceGrid }: RowInsertBeforeTransformation): string {
  const row = rowRangeLocator.start.row
  const count = rowRangeLocator.size()

  if (cellLocator.row >= row) {
    return transformMoveOnCell(
      cellGrid,
      cellLocator,
      {
        type: 'move',
        sourceGrid,
        movement: {
          fromGrid: cellGrid,
          toGrid: cellGrid,
          deltaCol: 0,
          deltaRow: count,
        },
      },
    )
  }
  return cellLocator.toString(cellGrid)
}

export function transformColInsertBeforeOnCell(cellGrid: string, cellLocator: CellLocator, { colRangeLocator, sourceGrid }: ColInsertBeforeTransformation): string {
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  if (cellLocator.col >= col) {
    return transformMoveOnCell(
      cellGrid,
      cellLocator,
      {
        type: 'move',
        sourceGrid,
        movement: {
          fromGrid: cellGrid,
          toGrid: cellGrid,
          deltaCol: count,
          deltaRow: 0,
        },
      },
    )
  }
  return cellLocator.toString(cellGrid)
}
