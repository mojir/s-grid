import type { Reference } from '../reference/utils'
import type { Dimensions, Position } from '.'

export class Rectangle implements Position, Dimensions {
  public readonly x: number
  public readonly y: number
  public readonly width: number
  public readonly height: number

  private constructor(x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  public area(): number {
    return this.width * this.height
  }

  public static fromPositionAndDimensions({ position, dimensions }: { position: Position, dimensions: Dimensions }): Rectangle {
    return new Rectangle(position.x, position.y, dimensions.width, dimensions.height)
  }

  public static fromReference(reference: Reference): Rectangle {
    const rangeReference = reference.toRangeReference()
    const grid = rangeReference.grid

    const prevRows = grid.rows.value.slice(0, rangeReference.start.rowIndex)
    const top = prevRows.reduce((acc, row) => acc + row.height.value, 0)

    const prevCols = grid.cols.value.slice(0, rangeReference.start.colIndex)
    const left = prevCols.reduce((acc, col) => acc + col.width.value, 0)

    const rows = grid.rows.value.slice(rangeReference.start.rowIndex, rangeReference.end.rowIndex + 1)
    const height = rows.reduce((acc, row) => acc + row.height.value, 0)

    const cols = grid.cols.value.slice(rangeReference.start.colIndex, rangeReference.end.colIndex + 1)
    const width = cols.reduce((acc, col) => acc + col.width.value, 0)

    return new Rectangle(left, top, width, height)
  }
}
