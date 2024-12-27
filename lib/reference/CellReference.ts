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
  public readonly colIndex: number
  public readonly absRow: boolean
  public readonly rowIndex: number

  public constructor(
    {
      grid,
      absCol,
      colIndex,
      absRow,
      rowIndex,
    }: {
      grid: Grid
      absCol: boolean
      colIndex: number
      absRow: boolean
      rowIndex: number
    },
  ) {
    if (colIndex < 0) {
      throw new Error(`Col ${colIndex} is out of range`)
    }
    if (rowIndex < 0) {
      throw new Error(`Row ${rowIndex} is out of range`)
    }
    if (colIndex > maxNumberOfCols) {
      throw new Error(`Col ${colIndex} is out of range`)
    }
    if (rowIndex > maxNumberOfRows) {
      throw new Error(`Row ${rowIndex} is out of range`)
    }

    this.grid = grid
    this.absCol = absCol
    this.colIndex = colIndex
    this.absRow = absRow
    this.rowIndex = rowIndex
  }

  static fromString(grid: Grid, str: string): CellReference {
    const match = str.match(cellReferenceRegExp)
    if (!match) {
      throw new Error(`Invalid cell reference: ${str}`)
    }

    grid = match[1] ? grid.project.getGrid(match[1]) : grid
    const absCol = !!match[2]
    const colId = match[3]!
    const colIndex = getColIndex(colId)
    const absRow = !!match[4]
    const rowId = match[5]!
    const rowIndex = getRowIndex(rowId)
    return new CellReference({
      grid,
      absCol,
      colIndex,
      absRow,
      rowIndex,
    })
  }

  static fromCoords(
    grid: Grid,
    { rowIndex, colIndex }: { rowIndex: number, colIndex: number },
  ): CellReference {
    return new CellReference({
      grid,
      absCol: false,
      colIndex,
      absRow: false,
      rowIndex,
    })
  }

  public getSurroundingRowIndices(boundingRange: RangeReference): number[] {
    const { startRowIndex, endRowIndex } = boundingRange.getCoords()

    return [
      Math.max(startRowIndex, this.rowIndex - 2),
      Math.min(endRowIndex, this.rowIndex + 2),
    ]
  }

  public getSurroundingColIndices(boundingRange: RangeReference): number[] {
    const { startColIndex, endColIndex } = boundingRange.getCoords()

    return [
      Math.max(startColIndex, this.colIndex - 1),
      Math.min(endColIndex, this.colIndex + 1),
    ]
  }

  public getSurroundingCorners(boundingRange: RangeReference): CellReference[] {
    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = boundingRange.getCoords()

    const upperRow = Math.max(startRowIndex, this.rowIndex - 2)
    const lowerRow = Math.min(endRowIndex, this.rowIndex + 2)
    const leftCol = Math.max(startColIndex, this.colIndex - 1)
    const rightCol = Math.min(endColIndex, this.colIndex + 1)

    return [
      CellReference.fromCoords(this.grid, { rowIndex: upperRow, colIndex: leftCol }),
      CellReference.fromCoords(this.grid, { rowIndex: upperRow, colIndex: rightCol }),
      CellReference.fromCoords(this.grid, { rowIndex: lowerRow, colIndex: leftCol }),
      CellReference.fromCoords(this.grid, { rowIndex: lowerRow, colIndex: rightCol }),
    ]
  }

  public toRangeReference(): RangeReference {
    return RangeReference.fromCellReference(this)
  }

  public getCell(): Cell {
    return this.grid.getCell(this)
  }

  public getCells(): Cell[] {
    return [this.getCell()]
  }

  public getOutput(): unknown {
    return this.getCell().output.value
  }

  public toStringForGrid(currentGrid: Grid): string {
    return this.grid === currentGrid ? this.toStringWithoutGrid() : this.toStringWithGrid()
  }

  public toStringWithoutGrid(): string {
    return `${this.absCol ? '$' : ''}${getColId(this.colIndex)}${this.absRow ? '$' : ''}${getRowId(this.rowIndex)}`
  }

  public toStringWithGrid(): string {
    return `${this.grid.name.value}!${this.toStringWithoutGrid()}`
  }

  public equals(other: Reference): boolean {
    if (other.grid !== this.grid) {
      return false
    }

    if (other instanceof CellReference) {
      return other.grid === this.grid && other.colIndex === this.colIndex && other.rowIndex === this.rowIndex
    }

    return other.toRangeReference().equals(other)
  }

  public toRelative(): CellReference {
    return new CellReference({
      grid: this.grid,
      absCol: false,
      colIndex: this.colIndex,
      absRow: false,
      rowIndex: this.rowIndex,
    })
  }

  public clamp(boundingRange: RangeReference): CellReference {
    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = boundingRange.getCoords()
    const clampedRow = Math.max(startRowIndex, Math.min(this.rowIndex, endRowIndex))
    const clampedCol = Math.max(startColIndex, Math.min(this.colIndex, endColIndex))
    if (clampedRow === this.rowIndex && clampedCol === this.colIndex) {
      return this
    }
    return new CellReference({
      grid: this.grid,
      absCol: this.absCol,
      colIndex: clampedCol,
      absRow: this.absRow,
      rowIndex: clampedRow,
    })
  }

  public move(movement: Movement): CellReference {
    const reference = new CellReference({
      grid: movement.toGrid,
      absCol: this.absCol,
      colIndex: this.colIndex + (movement.deltaCol ?? 0),
      absRow: this.absRow,
      rowIndex: this.rowIndex + (movement.deltaRow ?? 0),
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
    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = range.getCoords()
    let rowIndex = this.rowIndex - 1
    let colIndex = this.colIndex
    if (rowIndex < startRowIndex) {
      if (wrap) {
        rowIndex = endRowIndex
        colIndex -= 1
        if (colIndex < startColIndex) {
          colIndex = endColIndex
        }
      }
      else {
        rowIndex = startRowIndex
      }
    }
    return CellReference.fromCoords(this.grid, { rowIndex, colIndex })
  }

  private cellDown(range: RangeReference, wrap: boolean): CellReference {
    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = range.getCoords()
    let rowIndex = this.rowIndex + 1
    let colIndex = this.colIndex
    if (rowIndex > endRowIndex) {
      if (wrap) {
        rowIndex = startRowIndex
        colIndex += 1
        if (colIndex > endColIndex) {
          colIndex = startColIndex
        }
      }
      else {
        rowIndex = endRowIndex
      }
    }
    return CellReference.fromCoords(this.grid, { rowIndex, colIndex })
  }

  private cellRight(range: RangeReference, wrap: boolean): CellReference {
    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = range.getCoords()
    let rowIndex = this.rowIndex
    let colIndex = this.colIndex + 1
    if (colIndex > endColIndex) {
      if (wrap) {
        colIndex = startColIndex
        rowIndex += 1
        if (rowIndex > endRowIndex) {
          rowIndex = startRowIndex
        }
      }
      else {
        colIndex = endColIndex
      }
    }
    return CellReference.fromCoords(this.grid, { rowIndex, colIndex })
  }

  private cellLeft(range: RangeReference, wrap: boolean): CellReference {
    const { startRowIndex, startColIndex, endRowIndex, endColIndex } = range.getCoords()
    let rowIndex = this.rowIndex
    let colIndex = this.colIndex - 1
    if (colIndex < startColIndex) {
      if (wrap) {
        colIndex = endColIndex
        rowIndex -= 1
        if (rowIndex < startRowIndex) {
          rowIndex = endRowIndex
        }
      }
      else {
        colIndex = startColIndex
      }
    }
    return CellReference.fromCoords(this.grid, { rowIndex, colIndex })
  }

  private cellTop(range: RangeReference): CellReference {
    const { startRowIndex } = range.getCoords()
    return CellReference.fromCoords(this.grid, { rowIndex: startRowIndex, colIndex: this.colIndex })
  }

  private cellBottom(range: RangeReference): CellReference {
    const { endRowIndex } = range.getCoords()
    return CellReference.fromCoords(this.grid, { rowIndex: endRowIndex, colIndex: this.colIndex })
  }

  private cellLeftmost(range: RangeReference): CellReference {
    const { startColIndex } = range.getCoords()
    return CellReference.fromCoords(this.grid, { rowIndex: this.rowIndex, colIndex: startColIndex })
  }

  private cellRightmost(range: RangeReference): CellReference {
    const { endColIndex } = range.getCoords()
    return CellReference.fromCoords(this.grid, { rowIndex: this.rowIndex, colIndex: endColIndex })
  }

  private cellPageUp(range: RangeReference): CellReference {
    if (!range.containsCell(this)) {
      throw new Error(`Cell ${this.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopRow = Math.max(range.getCoords().startRowIndex, this.rowIndex - pageSize)

    if (this.rowIndex === stopRow) {
      return this
    }
    const hasInput = this.getCell().input.value !== ''
    const above = this.cellUp(range, false)
    if (above.rowIndex === stopRow) {
      return above
    }
    const aboveHasInput = above.getCell().input.value !== ''
    if (hasInput && !aboveHasInput) {
      let current = above
      do {
        current = current.cellUp(range, false)
      } while (current.rowIndex !== stopRow && current.getCell().input.value === '')
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
      } while (current.rowIndex !== stopRow)
      return current
    }
    else {
      let current = above
      while (current.rowIndex !== stopRow && current.getCell().input.value === '') {
        current = current.cellUp(range, false)
      }
      return current
    }
  }

  private cellPageDown(range: RangeReference): CellReference {
    if (!range.containsCell(this)) {
      throw new Error(`Cell ${this.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopRow = Math.min(range.getCoords().endRowIndex, this.rowIndex + pageSize)

    if (this.rowIndex === stopRow) {
      return this
    }
    const hasInput = this.getCell().input.value !== ''
    const below = this.cellDown(range, false)
    if (below.rowIndex === stopRow) {
      return below
    }
    const belowHasInput = below.getCell().input.value !== ''
    if (hasInput && !belowHasInput) {
      let current = below
      do {
        current = current.cellDown(range, false)
      } while (current.rowIndex !== stopRow && current.getCell().input.value === '')
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
      } while (current.rowIndex !== stopRow)
      return current
    }
    else {
      let current = below
      while (current.rowIndex !== stopRow && current.getCell().input.value === '') {
        current = current.cellDown(range, false)
      }
      return current
    }
  }

  private cellPageLeft(range: RangeReference): CellReference {
    if (!range.containsCell(this)) {
      throw new Error(`Cell ${this.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopCol = Math.max(range.getCoords().startColIndex, this.colIndex - pageSize)

    if (this.colIndex === stopCol) {
      return this
    }
    const hasInput = this.getCell().input.value !== ''
    const leftOf = this.cellLeft(range, false)
    if (leftOf.colIndex === stopCol) {
      return leftOf
    }
    const leftOfHasInput = leftOf.getCell().input.value !== ''
    if (hasInput && !leftOfHasInput) {
      let current = leftOf
      do {
        current = current.cellLeft(range, false)
      } while (current.colIndex !== stopCol && current.getCell().input.value === '')
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
      } while (current.colIndex !== stopCol)
      return current
    }
    else {
      let current = leftOf
      while (current.colIndex !== stopCol && current.getCell().input.value === '') {
        current = current.cellLeft(range, false)
      }
      return current
    }
  }

  private cellPageRight(range: RangeReference): CellReference {
    if (!range.containsCell(this)) {
      throw new Error(`Cell ${this.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopCol = Math.min(range.getCoords().endColIndex, this.colIndex + pageSize)

    if (this.colIndex === stopCol) {
      return this
    }
    const hasInput = this.getCell().input.value !== ''
    const rightOf = this.cellRight(range, false)
    if (rightOf.colIndex === stopCol) {
      return rightOf
    }
    const rightOfHasInput = rightOf.getCell().input.value !== ''
    if (hasInput && !rightOfHasInput) {
      let current = rightOf
      do {
        current = current.cellRight(range, false)
      } while (current.colIndex !== stopCol && current.getCell().input.value === '')
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
      } while (current.colIndex !== stopCol)
      return current
    }
    else {
      let current = rightOf
      while (current.colIndex !== stopCol && current.getCell().input.value === '') {
        current = current.cellRight(range, false)
      }
      return current
    }
  }
}
