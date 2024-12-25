import { cellReferenceRegExp, maxNumberOfCols, maxNumberOfRows, pageSize } from '../constants'
import { getColId, getColIndex, getRowId, getRowIndex } from '../utils'
import type { Grid } from '../grid/Grid'
import type { Cell } from '../Cell'
import { RangeReference } from './RangeReference'
import type { Direction, Reference, Movement } from './utils'

export function isCellReferenceString(id: string): boolean {
  return cellReferenceRegExp.test(id)
}

export class CellReference {
  public readonly grid: Grid
  public readonly absCol: boolean
  public readonly col: number
  public readonly absRow: boolean
  public readonly row: number

  public constructor(
    {
      grid,
      absCol,
      col,
      absRow,
      row,
    }: {
      grid: Grid
      absCol: boolean
      col: number
      absRow: boolean
      row: number
    },
  ) {
    if (col < 0) {
      throw new Error(`Col ${col} is out of range`)
    }
    if (row < 0) {
      throw new Error(`Row ${row} is out of range`)
    }
    if (col > maxNumberOfCols) {
      throw new Error(`Col ${col} is out of range`)
    }
    if (row > maxNumberOfRows) {
      throw new Error(`Row ${row} is out of range`)
    }

    this.grid = grid
    this.absCol = absCol
    this.col = col
    this.absRow = absRow
    this.row = row
  }

  static fromString(grid: Grid, str: string): CellReference {
    const match = str.match(cellReferenceRegExp)
    if (!match) {
      throw new Error(`Invalid cell reference: ${str}`)
    }

    grid = match[1] ? grid.project.getGrid(match[1]) : grid
    const absCol = !!match[2]
    const colId = match[3]
    const col = getColIndex(colId)
    const absRow = !!match[4]
    const rowId = match[5]
    const row = getRowIndex(rowId)
    return new CellReference({
      grid,
      absCol,
      col,
      absRow,
      row,
    })
  }

  static fromCoords(grid: Grid, { row, col }: { row: number, col: number }): CellReference {
    return new CellReference({
      grid,
      absCol: false,
      col,
      absRow: false,
      row,
    })
  }

  public getSurroundingRowIndices(boundingRange: RangeReference): number[] {
    const { startRow, endRow } = boundingRange.getCoords()

    return [
      Math.max(startRow, this.row - 2),
      Math.min(endRow, this.row + 2),
    ]
  }

  public getSurroundingColIndices(boundingRange: RangeReference): number[] {
    const { startCol, endCol } = boundingRange.getCoords()

    return [
      Math.max(startCol, this.col - 1),
      Math.min(endCol, this.col + 1),
    ]
  }

  public getSurroundingCorners(boundingRange: RangeReference): CellReference[] {
    const { startRow, startCol, endRow, endCol } = boundingRange.getCoords()

    const upperRow = Math.max(startRow, this.row - 2)
    const lowerRow = Math.min(endRow, this.row + 2)
    const leftCol = Math.max(startCol, this.col - 1)
    const rightCol = Math.min(endCol, this.col + 1)

    return [
      CellReference.fromCoords(this.grid, { row: upperRow, col: leftCol }),
      CellReference.fromCoords(this.grid, { row: upperRow, col: rightCol }),
      CellReference.fromCoords(this.grid, { row: lowerRow, col: leftCol }),
      CellReference.fromCoords(this.grid, { row: lowerRow, col: rightCol }),
    ]
  }

  public toRangeReference(): RangeReference {
    return RangeReference.fromCellReference(this)
  }

  public getCell(): Cell {
    const cell = this.grid.cells[this.row][this.col]
    if (!cell) {
      throw new Error(`Cell ${this.toStringWithGrid()} does not exist`)
    }
    return cell
  }

  public getCells(): Cell[] {
    return [this.getCell()]
  }

  public getOutput(): unknown {
    return this.getCell().output.value
  }

  public toString(currentGrid: Grid): string {
    return this.grid === currentGrid ? this.toStringWithoutGrid() : this.toStringWithGrid()
  }

  public toStringWithoutGrid(): string {
    return `${this.absCol ? '$' : ''}${getColId(this.col)}${this.absRow ? '$' : ''}${getRowId(this.row)}`
  }

  public toStringWithGrid(): string {
    return `${this.grid.name.value}!${this.toStringWithoutGrid()}`
  }

  public equals(other: Reference): boolean {
    if (other.grid !== this.grid) {
      return false
    }

    if (other instanceof CellReference) {
      return other.grid === this.grid && other.col === this.col && other.row === this.row
    }

    return other.toRangeReference().equals(other)
  }

  public toRelative(): CellReference {
    return new CellReference({
      grid: this.grid,
      absCol: false,
      col: this.col,
      absRow: false,
      row: this.row,
    })
  }

  public clamp(boundingRange: RangeReference): CellReference {
    const { startRow, startCol, endRow, endCol } = boundingRange.getCoords()
    const clampedRow = Math.max(startRow, Math.min(this.row, endRow))
    const clampedCol = Math.max(startCol, Math.min(this.col, endCol))
    if (clampedRow === this.row && clampedCol === this.col) {
      return this
    }
    return new CellReference({
      grid: this.grid,
      absCol: this.absCol,
      col: clampedCol,
      absRow: this.absRow,
      row: clampedRow,
    })
  }

  public move(movement: Movement): CellReference {
    const reference = new CellReference({
      grid: movement.toGrid,
      absCol: this.absCol,
      col: this.col + (movement.deltaCol ?? 0),
      absRow: this.absRow,
      row: this.row + (movement.deltaRow ?? 0),
    })
    if (reference.equals(reference.clamp(this.grid.gridRange.value))) {
      return reference
    }
    throw new Error(`Cell ${this.toStringWithGrid()} cannot be moved to ${reference.toStringWithGrid()}`)
  }

  public moveInDirection(dir: Direction, boundingRange: RangeReference, wrap: boolean): CellReference {
    switch (dir) {
      case 'up': return this.cellUp(boundingRange, wrap)
      case 'down': return this.cellDown(boundingRange, wrap)
      case 'right': return this.cellRight(boundingRange, wrap)
      case 'left': return this.cellLeft(boundingRange, wrap)
      case 'top': return this.cellTop(boundingRange)
      case 'bottom': return this.cellBottom(boundingRange)
      case 'leftmost': return this.cellLeftmost(boundingRange)
      case 'rightmost': return this.cellRightmost(boundingRange)
      case 'pageDown': return this.cellPageDown(boundingRange)
      case 'pageUp': return this.cellPageUp(boundingRange)
      case 'pageLeft': return this.cellPageLeft(boundingRange)
      case 'pageRight': return this.cellPageRight(boundingRange)
      default: throw new Error(`Unsupported direction: ${dir}`)
    }
  }

  private cellUp(range: RangeReference, wrap: boolean): CellReference {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    let row = this.row - 1
    let col = this.col
    if (row < startRow) {
      if (wrap) {
        row = endRow
        col -= 1
        if (col < startCol) {
          col = endCol
        }
      }
      else {
        row = startRow
      }
    }
    return CellReference.fromCoords(this.grid, { row, col })
  }

  private cellDown(range: RangeReference, wrap: boolean): CellReference {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    let row = this.row + 1
    let col = this.col
    if (row > endRow) {
      if (wrap) {
        row = startRow
        col += 1
        if (col > endCol) {
          col = startCol
        }
      }
      else {
        row = endRow
      }
    }
    return CellReference.fromCoords(this.grid, { row, col })
  }

  private cellRight(range: RangeReference, wrap: boolean): CellReference {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    let row = this.row
    let col = this.col + 1
    if (col > endCol) {
      if (wrap) {
        col = startCol
        row += 1
        if (row > endRow) {
          row = startRow
        }
      }
      else {
        col = endCol
      }
    }
    return CellReference.fromCoords(this.grid, { row, col })
  }

  private cellLeft(range: RangeReference, wrap: boolean): CellReference {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    let row = this.row
    let col = this.col - 1
    if (col < startCol) {
      if (wrap) {
        col = endCol
        row -= 1
        if (row < startRow) {
          row = endRow
        }
      }
      else {
        col = startCol
      }
    }
    return CellReference.fromCoords(this.grid, { row, col })
  }

  private cellTop(range: RangeReference): CellReference {
    const { startRow } = range.getCoords()
    return CellReference.fromCoords(this.grid, { row: startRow, col: this.col })
  }

  private cellBottom(range: RangeReference): CellReference {
    const { endRow } = range.getCoords()
    return CellReference.fromCoords(this.grid, { row: endRow, col: this.col })
  }

  private cellLeftmost(range: RangeReference): CellReference {
    const { startCol } = range.getCoords()
    return CellReference.fromCoords(this.grid, { row: this.row, col: startCol })
  }

  private cellRightmost(range: RangeReference): CellReference {
    const { endCol } = range.getCoords()
    return CellReference.fromCoords(this.grid, { row: this.row, col: endCol })
  }

  private cellPageUp(range: RangeReference): CellReference {
    if (!range.containsCell(this)) {
      throw new Error(`Cell ${this.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopRow = Math.max(range.getCoords().startRow, this.row - pageSize)

    if (this.row === stopRow) {
      return this
    }
    const hasInput = this.getCell().input.value !== ''
    const above = this.cellUp(range, false)
    if (above.row === stopRow) {
      return above
    }
    const aboveHasInput = above.getCell().input.value !== ''
    if (hasInput && !aboveHasInput) {
      let current = above
      do {
        current = current.cellUp(range, false)
      } while (current.row !== stopRow && current.getCell().input.value === '')
      return current
    }
    else if (hasInput && aboveHasInput) {
      let previous = above
      let current = above
      do {
        previous = current
        current = current.cellUp(range, false)
        if (current.getCell().input.value === '') {
          return previous
        }
      } while (current.row !== stopRow)
      return current
    }
    else {
      let current = above
      while (current.row !== stopRow && current.getCell().input.value === '') {
        current = current.cellUp(range, false)
      }
      return current
    }
  }

  private cellPageDown(range: RangeReference): CellReference {
    if (!range.containsCell(this)) {
      throw new Error(`Cell ${this.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopRow = Math.min(range.getCoords().endRow, this.row + pageSize)

    if (this.row === stopRow) {
      return this
    }
    const hasInput = this.getCell().input.value !== ''
    const below = this.cellDown(range, false)
    if (below.row === stopRow) {
      return below
    }
    const belowHasInput = below.getCell().input.value !== ''
    if (hasInput && !belowHasInput) {
      let current = below
      do {
        current = current.cellDown(range, false)
      } while (current.row !== stopRow && current.getCell().input.value === '')
      return current
    }
    else if (hasInput && belowHasInput) {
      let previous = below
      let current = below
      do {
        previous = current
        current = current.cellDown(range, false)
        if (current.getCell().input.value === '') {
          return previous
        }
      } while (current.row !== stopRow)
      return current
    }
    else {
      let current = below
      while (current.row !== stopRow && current.getCell().input.value === '') {
        current = current.cellDown(range, false)
      }
      return current
    }
  }

  private cellPageLeft(range: RangeReference): CellReference {
    if (!range.containsCell(this)) {
      throw new Error(`Cell ${this.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopCol = Math.max(range.getCoords().startCol, this.col - pageSize)

    if (this.col === stopCol) {
      return this
    }
    const hasInput = this.getCell().input.value !== ''
    const leftOf = this.cellLeft(range, false)
    if (leftOf.col === stopCol) {
      return leftOf
    }
    const leftOfHasInput = leftOf.getCell().input.value !== ''
    if (hasInput && !leftOfHasInput) {
      let current = leftOf
      do {
        current = current.cellLeft(range, false)
      } while (current.col !== stopCol && current.getCell().input.value === '')
      return current
    }
    else if (hasInput && leftOfHasInput) {
      let previous = leftOf
      let current = leftOf
      do {
        previous = current
        current = current.cellLeft(range, false)
        if (current.getCell().input.value === '') {
          return previous
        }
      } while (current.col !== stopCol)
      return current
    }
    else {
      let current = leftOf
      while (current.col !== stopCol && current.getCell().input.value === '') {
        current = current.cellLeft(range, false)
      }
      return current
    }
  }

  private cellPageRight(range: RangeReference): CellReference {
    if (!range.containsCell(this)) {
      throw new Error(`Cell ${this.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopCol = Math.min(range.getCoords().endCol, this.col + pageSize)

    if (this.col === stopCol) {
      return this
    }
    const hasInput = this.getCell().input.value !== ''
    const rightOf = this.cellRight(range, false)
    if (rightOf.col === stopCol) {
      return rightOf
    }
    const rightOfHasInput = rightOf.getCell().input.value !== ''
    if (hasInput && !rightOfHasInput) {
      let current = rightOf
      do {
        current = current.cellRight(range, false)
      } while (current.col !== stopCol && current.getCell().input.value === '')
      return current
    }
    else if (hasInput && rightOfHasInput) {
      let previous = rightOf
      let current = rightOf
      do {
        previous = current
        current = current.cellRight(range, false)
        if (current.getCell().input.value === '') {
          return previous
        }
      } while (current.col !== stopCol)
      return current
    }
    else {
      let current = rightOf
      while (current.col !== stopCol && current.getCell().input.value === '') {
        current = current.cellRight(range, false)
      }
      return current
    }
  }
}
