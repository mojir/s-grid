import type { Cell } from '../Cell'
import type { Col } from '../Col'
import { rangeRangeRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import { matrixMap } from '../matrix'
import type { Row } from '../Row'
import { getColId, getRowId } from '../utils'
import { CellReference } from './CellReference'
import type { Reference, Movement } from './utils'

export function isRangeReferenceString(value: string): boolean {
  const match = rangeRangeRegExp.exec(value)
  if (!match) {
    return false
  }
  const { colStart, rowStart, colEnd, rowEnd } = match.groups ?? {}
  if ((colStart && rowEnd) || (rowStart && colEnd)) {
    return false
  }
  return true
}

type Coords = {
  startRowIndex: number
  startColIndex: number
  endRowIndex: number
  endColIndex: number
}

function getStartString({ col, row, cell }: { col?: string, row?: string, cell?: string }): string {
  return row ? `A${row}` : col ? `${col}1` : cell!
}

function getEndString(grid: Grid, { col, row, cell }: { col?: string, row?: string, cell?: string }): string {
  return row
    ? `${getColId(grid.cols.value.length - 1)}${row}`
    : col
      ? `${col}${getRowId(grid.rows.value.length - 1)}`
      : cell!
}

export class RangeReference {
  public readonly grid: Grid
  public readonly start: CellReference
  public readonly end: CellReference

  private constructor(start: CellReference, end: CellReference) {
    if (start.grid !== end.grid) {
      throw new Error(`Cannot create cell range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }

    this.grid = start.grid

    if (start.colIndex <= end.colIndex && start.rowIndex <= end.rowIndex) {
      this.start = start
      this.end = end
    }
    else if (start.colIndex <= end.colIndex && start.rowIndex > end.rowIndex) {
      this.start = new CellReference({
        grid: this.grid,
        absCol: start.absCol,
        colIndex: start.colIndex,
        absRow: end.absRow,
        rowIndex: end.rowIndex,
      })
      this.end = new CellReference({
        grid: this.grid,
        absCol: end.absCol,
        colIndex: end.colIndex,
        absRow: start.absRow,
        rowIndex: start.rowIndex,
      })
    }
    else if (start.colIndex > end.colIndex && start.rowIndex <= end.rowIndex) {
      this.start = new CellReference({
        grid: this.grid,
        absCol: end.absCol,
        colIndex: end.colIndex,
        absRow: start.absRow,
        rowIndex: start.rowIndex,
      })
      this.end = new CellReference({
        grid: this.grid,
        absCol: start.absCol,
        colIndex: start.colIndex,
        absRow: end.absRow,
        rowIndex: end.rowIndex,
      })
    }
    else {
      this.start = end
      this.end = start
    }
  }

  public rowCount(): number {
    return this.end.rowIndex - this.start.rowIndex + 1
  }

  public colCount(): number {
    return this.end.colIndex - this.start.colIndex + 1
  }

  public size(): number {
    return this.rowCount() * this.colCount()
  }

  static fromString(grid: Grid, str: string): RangeReference {
    const match = str.match(rangeRangeRegExp)

    if (match?.groups) {
      const { colStart, rowStart, cellStart, colEnd, rowEnd, cellEnd } = match.groups
      const reverse = !!(cellEnd && !cellStart)

      const startCellString = reverse
        ? getStartString({ col: colEnd, row: rowEnd, cell: cellEnd })
        : getStartString({ col: colStart, row: rowStart, cell: cellStart })

      const endCellString = reverse
        ? getEndString(grid, { col: colStart, row: rowStart, cell: cellStart })
        : getEndString(grid, { col: colEnd, row: rowEnd, cell: cellEnd })

      const gridName = match.groups.grid ?? grid.name.value
      const startString = `${gridName}!${startCellString}`
      const endString = `${gridName}!${endCellString}`
      if (cellEnd && !cellStart) {
        return new RangeReference(
          CellReference.fromString(grid, endString),
          CellReference.fromString(grid, startString),
        )
      }
      else {
        return new RangeReference(
          CellReference.fromString(grid, startString),
          CellReference.fromString(grid, endString),
        )
      }
    }

    throw new Error(`Invalid range reference: ${str}`)
  }

  static fromCellReference(cellReference: CellReference): RangeReference {
    return new RangeReference(cellReference, cellReference)
  }

  static fromCellReferences(start: CellReference, end: CellReference): RangeReference {
    return new RangeReference(start, end)
  }

  static fromCoords(grid: Grid, coords: Coords): RangeReference {
    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = coords
    return new RangeReference(
      new CellReference({ rowIndex: startRowIndex,
        colIndex: startColIndex,
        absRow: false,
        absCol: false,
        grid,
      }),
      new CellReference({ rowIndex: endRowIndex,
        colIndex: endColIndex,
        absRow: false,
        absCol: false,
        grid,
      }),
    )
  }

  static fromColIndex(grid: Grid, colIndex: number, count = 1): RangeReference {
    return new RangeReference(
      new CellReference({
        grid,
        absCol: false,
        colIndex: colIndex,
        absRow: false,
        rowIndex: 0,
      }),
      new CellReference({
        grid,
        absCol: false,
        colIndex: colIndex + count - 1,
        absRow: false, rowIndex: grid.rows.value.length - 1,
      }),
    )
  }

  static fromRowIndex(grid: Grid, rowIndex: number, count = 1): RangeReference {
    return new RangeReference(
      new CellReference({ grid,
        absCol: false,
        colIndex: 0,
        absRow: false,
        rowIndex,
      }),
      new CellReference({ grid,
        absCol: false,
        colIndex: grid.cols.value.length - 1,
        absRow: false,
        rowIndex: rowIndex + count - 1,
      }),
    )
  }

  public getOutput(): unknown {
    return matrixMap(
      this.getCellIdMatrix(),
      reference => reference.getCell().output.value,
    )
  }

  public getCells(): Cell[] {
    return this.getAllCellReferences().map(reference => reference.getCell())
  }

  public toStringForGrid(currentGrid: Grid): string {
    return this.grid === currentGrid ? this.toStringWithoutGrid() : this.toStringWithGrid()
  }

  public toStringWithoutGrid(): string {
    return `${this.start.toStringWithoutGrid()}:${this.end.toStringWithoutGrid()}`
  }

  public toStringWithGrid(): string {
    return `${this.grid.name.value}!${this.toStringWithoutGrid()}`
  }

  public equals(other: Reference): boolean {
    if (other.grid !== this.grid) {
      return false
    }

    if (other instanceof CellReference) {
      return other.toRangeReference().equals(this)
    }

    return this.start.equals(other.start) && this.end.equals(other.end)
  }

  public getCoords(): Coords {
    return {
      startRowIndex: this.start.rowIndex,
      startColIndex: this.start.colIndex,
      endRowIndex: this.end.rowIndex,
      endColIndex: this.end.colIndex,
    }
  }

  public clamp(range: RangeReference): RangeReference {
    if (this.grid !== range.grid) {
      throw new Error(
        `Cannot clamp cell range from different grids: ${this.toStringWithGrid()} and ${range.toStringWithGrid()}`,
      )
    }
    const clampedStart = this.start.clamp(range)
    const clampedEnd = this.end.clamp(range)

    return RangeReference.fromCellReferences(clampedStart, clampedEnd)
  }

  public getAllCellReferences(): CellReference[] {
    const cellReferences: CellReference[] = []

    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = this.getCoords()

    for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
      for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex += 1) {
        cellReferences.push(new CellReference({
          grid: this.grid,
          absCol: false,
          colIndex,
          absRow: false,
          rowIndex,
        }))
      }
    }

    return cellReferences
  }

  public toRangeReference() {
    return this
  }

  public getAllRowIndices(): number[] {
    const rowIndices: number[] = []

    const { startRowIndex, endRowIndex } = this.getCoords()

    for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
      rowIndices.push(rowIndex)
    }

    return rowIndices
  }

  public getAllRows(): Row[] {
    return this.getAllRowIndices().map(rowIndex => this.grid.rows.value[rowIndex]!)
  }

  public getAllColIndices(): number[] {
    const colIndices: number[] = []

    const { startColIndex, endColIndex } = this.getCoords()

    for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex += 1) {
      colIndices.push(colIndex)
    }

    return colIndices
  }

  public getAllCols(): Col[] {
    return this.getAllColIndices().map(colIndex => this.grid.cols.value[colIndex]!)
  }

  public getCellIdMatrix(): CellReference[][] {
    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = this.getCoords()

    const matrix: CellReference[][] = []
    for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
      const rowArray: CellReference[] = []
      matrix.push(rowArray)
      for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex += 1) {
        rowArray.push(new CellReference({
          grid: this.grid,
          absCol: false,
          colIndex,
          absRow: false,
          rowIndex,
        }))
      }
    }
    return matrix
  }

  public containsCell(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.rowIndex >= this.start.rowIndex
      && cellReference.rowIndex <= this.end.rowIndex
      && cellReference.colIndex >= this.start.colIndex
      && cellReference.colIndex <= this.end.colIndex
  }

  public containsRowIndex(rowIndex: number): boolean {
    return rowIndex >= this.start.rowIndex && rowIndex <= this.end.rowIndex
  }

  public containsColIndex(colIndex: number): boolean {
    return colIndex >= this.start.colIndex && colIndex <= this.end.colIndex
  }

  public isCellInTopRow(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.rowIndex === this.start.rowIndex
  }

  public isCellBottomRow(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.rowIndex === this.end.rowIndex
  }

  public isCellIdLeftColumn(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.colIndex === this.start.colIndex
  }

  public isCellIdRightColumn(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.colIndex === this.end.colIndex
  }

  public move(movement: Movement): RangeReference {
    return RangeReference.fromCellReferences(this.start.move(movement), this.end.move(movement))
  }
}
