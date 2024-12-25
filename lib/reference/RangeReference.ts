import type { Cell } from '../Cell'
import { rangeRangeRegExp } from '../constants'
import type { Grid } from '../grid/Grid'
import { matrixMap } from '../matrix'
import { getColId, getRowId } from '../utils'
import { CellReference } from './CellReference'
import { BaseReference } from './BaseReference'
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
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

function getStartString({ col, row, cell }: { col?: string, row?: string, cell?: string }): string {
  return row ? `A${row}` : col ? `${col}1` : cell!
}

function getEndString(grid: Grid, { col, row, cell }: { col?: string, row?: string, cell?: string }): string {
  return row ? `${getColId(grid.cols.value.length - 1)}${row}` : col ? `${col}${getRowId(grid.rows.value.length - 1)}` : cell!
}

export class RangeReference extends BaseReference {
  public readonly start: CellReference
  public readonly end: CellReference
  public readonly nbrOfCols: number
  public readonly nbrOfRows: number
  public readonly size: ComputedRef<number>

  private constructor(start: CellReference, end: CellReference) {
    if (start.grid !== end.grid) {
      throw new Error(`Cannot create cell range from different grids: ${start.toStringWithGrid()} - ${end.toStringWithGrid()}`)
    }

    super(start.grid)

    if (start.col <= end.col && start.row <= end.row) {
      this.start = start
      this.end = end
    }
    else if (start.col <= end.col && start.row > end.row) {
      this.start = new CellReference({
        grid: this.grid,
        absCol: start.absCol,
        col: start.col,
        absRow: end.absRow,
        row: end.row,
      })
      this.end = new CellReference({
        grid: this.grid,
        absCol: end.absCol,
        col: end.col,
        absRow: start.absRow,
        row: start.row,
      })
    }
    else if (start.col > end.col && start.row <= end.row) {
      this.start = new CellReference({
        grid: this.grid,
        absCol: end.absCol,
        col: end.col,
        absRow: start.absRow,
        row: start.row,
      })
      this.end = new CellReference({
        grid: this.grid,
        absCol: start.absCol,
        col: start.col,
        absRow: end.absRow,
        row: end.row,
      })
    }
    else {
      this.start = end
      this.end = start
    }

    this.nbrOfCols = this.end.col - this.start.col + 1
    this.nbrOfRows = this.end.row - this.start.row + 1
    this.size = computed(() => this.nbrOfCols * this.nbrOfRows)
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
    const { startRow, startCol, endRow, endCol } = coords
    return new RangeReference(
      new CellReference({ row: startRow, col: startCol, absRow: false, absCol: false, grid }),
      new CellReference({ row: endRow, col: endCol, absRow: false, absCol: false, grid }),
    )
  }

  static fromColIndex(grid: Grid, col: number, count = 1): RangeReference {
    return new RangeReference(
      new CellReference({ grid, absCol: false, col, absRow: false, row: 0 }),
      new CellReference({ grid, absCol: false, col: col + count - 1, absRow: false, row: grid.rows.value.length - 1 }),
    )
  }

  static fromRowIndex(grid: Grid, row: number, count = 1): RangeReference {
    return new RangeReference(
      new CellReference({ grid, absCol: false, col: 0, absRow: false, row }),
      new CellReference({ grid, absCol: false, col: grid.cols.value.length - 1, absRow: false, row: row + count - 1 }),
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

  public override toStringWithoutGrid(): string {
    return `${this.start.toStringWithoutGrid()}:${this.end.toStringWithoutGrid()}`
  }

  public override equals(other: Reference): boolean {
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
      startRow: this.start.row,
      startCol: this.start.col,
      endRow: this.end.row,
      endCol: this.end.col,
    }
  }

  public clamp(range: RangeReference): RangeReference {
    if (this.grid !== range.grid) {
      throw new Error(`Cannot clamp cell range from different grids: ${this.toStringWithGrid()} and ${range.toStringWithGrid()}`)
    }
    const clampedStart = this.start.clamp(range)
    const clampedEnd = this.end.clamp(range)

    return RangeReference.fromCellReferences(clampedStart, clampedEnd)
  }

  public getAllCellReferences(): CellReference[] {
    const cellReferences: CellReference[] = []

    const { startRow, startCol, endRow, endCol } = this.getCoords()

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        cellReferences.push(new CellReference({
          grid: this.grid,
          absCol: false,
          col,
          absRow: false,
          row,
        }))
      }
    }

    return cellReferences
  }

  public toRangeReference() {
    return this
  }

  public getAllRowIndices(): number[] {
    const rows: number[] = []

    const { startRow, endRow } = this.getCoords()

    for (let row = startRow; row <= endRow; row += 1) {
      rows.push(row)
    }

    return rows
  }

  public getAllColIndices(): number[] {
    const cols: number[] = []

    const { startCol, endCol } = this.getCoords()

    for (let col = startCol; col <= endCol; col += 1) {
      cols.push(col)
    }

    return cols
  }

  public getCellIdMatrix(): CellReference[][] {
    const { startRow, startCol, endRow, endCol } = this.getCoords()

    const matrix: CellReference[][] = []
    for (let row = startRow; row <= endRow; row++) {
      const rowArray: CellReference[] = []
      matrix.push(rowArray)
      for (let col = startCol; col <= endCol; col++) {
        rowArray.push(new CellReference({
          grid: this.grid,
          absCol: false,
          col,
          absRow: false,
          row,
        }))
      }
    }
    return matrix
  }

  public containsCell(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.row >= this.start.row
      && cellReference.row <= this.end.row
      && cellReference.col >= this.start.col
      && cellReference.col <= this.end.col
  }

  public containsRow(row: number): boolean {
    return row >= this.start.row && row <= this.end.row
  }

  public containsCol(col: number): boolean {
    return col >= this.start.col && col <= this.end.col
  }

  public isCellInTopRow(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.row === this.start.row
  }

  public isCellBottomRow(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.row === this.end.row
  }

  public isCellIdLeftColumn(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.col === this.start.col
  }

  public isCellIdRightColumn(cellReference: CellReference): boolean {
    if (this.grid !== cellReference.grid) {
      return false
    }
    return cellReference.col === this.end.col
  }

  public move(movement: Movement): RangeReference {
    return RangeReference.fromCellReferences(this.start.move(movement), this.end.move(movement))
  }
}
