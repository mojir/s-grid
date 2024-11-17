import { CellId, type Movement } from './CellId'

export class CellRange {
  public readonly id: string
  private constructor(
    public readonly start: CellId,
    public readonly end: CellId) {
    this.id = `${start.id}-${end.id}`
  }

  static isCellRange(value: unknown): value is CellRange {
    return value instanceof CellRange
  }

  static isCellRangeString(id: string): boolean {
    const parts = id.split('-')
    if (parts.length !== 2) {
      return false
    }
    return CellId.isCellIdString(parts[0]) && CellId.isCellIdString(parts[1])
  }

  static fromSingleCellId(cellId: CellId): CellRange {
    return new CellRange(cellId, cellId)
  }

  static fromCellIds(start: CellId, end: CellId): CellRange {
    return new CellRange(start, end)
  }

  static fromDimensions(startRowIndex: number, startColIndex: number, endRowIndex: number, endColIndex: number): CellRange {
    return new CellRange(CellId.fromCoords(startRowIndex, startColIndex), CellId.fromCoords(endRowIndex, endColIndex))
  }

  static fromId(id: string): CellRange {
    if (!CellRange.isCellRangeString(id)) {
      throw new Error(`Invalid cell range id: ${id}`)
    }

    const [startId, endId] = id.split('-')
    return new CellRange(CellId.fromId(startId), CellId.fromId(endId))
  }

  public size(): number {
    return (this.end.rowIndex - this.start.rowIndex + 1) * (this.end.colIndex - this.start.colIndex + 1)
  }

  public toSorted(): CellRange {
    const [startRowIndex, startColIndex, endRowIndex, endColIndex] = this.toCoords()

    const sortedStartRowIndex = Math.min(startRowIndex, endRowIndex)
    const sortedEndRowIndex = Math.max(startRowIndex, endRowIndex)
    const sortedStartColIndex = Math.min(startColIndex, endColIndex)
    const sortedEndColIndex = Math.max(startColIndex, endColIndex)

    return new CellRange(CellId.fromCoords(sortedStartRowIndex, sortedStartColIndex), CellId.fromCoords(sortedEndRowIndex, sortedEndColIndex))
  }

  public toCoords(): [number, number, number, number] {
    return [this.start.rowIndex, this.start.colIndex, this.end.rowIndex, this.end.colIndex]
  }

  public clamp(range: CellRange): CellRange {
    const sorted = this.toSorted()
    const clampedStart = sorted.start.clamp(range)
    const clampedEnd = sorted.end.clamp(range)

    return CellRange.fromCellIds(clampedStart, clampedEnd)
  }

  public getAllCellIds(): CellId[] {
    const [startRowIndex, startColIndex, endRowIndex, endColIndex] = this.toCoords()
    const cellIds: CellId[] = []

    for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
      for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex += 1) {
        cellIds.push(CellId.fromCoords(rowIndex, colIndex))
      }
    }

    return cellIds
  }

  public getCellIdMatrix(): CellId[][] {
    const [startRow, startCol, endRow, endCol] = this.toSorted().toCoords()

    const matrix: CellId[][] = []
    for (let row = startRow; row <= endRow; row++) {
      const rowArray: CellId[] = []
      matrix.push(rowArray)
      for (let col = startCol; col <= endCol; col++) {
        rowArray.push(CellId.fromCoords(row, col))
      }
    }
    return matrix
  }

  public contains(cellId: CellId): boolean {
    const sorted = this.toSorted()
    return cellId.rowIndex >= sorted.start.rowIndex
      && cellId.rowIndex <= sorted.end.rowIndex
      && cellId.colIndex >= sorted.start.colIndex
      && cellId.colIndex <= sorted.end.colIndex
  }

  public containsRowIndex(rowIndex: number): boolean {
    const sorted = this.toSorted()
    return rowIndex >= sorted.start.rowIndex && rowIndex <= sorted.end.rowIndex
  }

  public containsColIndex(colIndex: number): boolean {
    const sorted = this.toSorted()
    return colIndex >= sorted.start.colIndex && colIndex <= sorted.end.colIndex
  }

  public isCellIdInTopRow(cellId: CellId): boolean {
    return cellId.rowIndex === this.start.rowIndex
  }

  public isCellIdInBottomRow(cellId: CellId): boolean {
    return cellId.rowIndex === this.end.rowIndex
  }

  public isCellIdInLeftColumn(cellId: CellId): boolean {
    return cellId.colIndex === this.start.colIndex
  }

  public isCellIdInRightColumn(cellId: CellId): boolean {
    return cellId.colIndex === this.end.colIndex
  }

  public equals(other: CellRange): boolean {
    return this.start.equals(other.start) && this.end.equals(other.end)
  }

  public move(movement: Movement): CellRange {
    return CellRange.fromCellIds(this.start.move(movement), this.end.move(movement))
  }

  public getJson() {
    return {
      'id': this.id,
      'start-id': this.start.id,
      'end-id': this.end.id,
      'start-row-index': this.start.rowIndex,
      'start-col-index': this.start.colIndex,
      'end-row-index': this.end.rowIndex,
      'end-col-index': this.end.colIndex,
    }
  }
}
