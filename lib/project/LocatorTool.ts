import type { Col } from '../Col'
import { CellLocator } from '../locators/CellLocator'
import { ColLocator } from '../locators/ColLocator'
import { ColRangeLocator } from '../locators/ColRangeLocator'
import { RangeLocator } from '../locators/RangeLocator'
import { RowLocator } from '../locators/RowLocator'
import { RowRangeLocator } from '../locators/RowRangeLocator'
import type { AnyLocator, Direction } from '../locators/utils'
import type { Row } from '../Row'
import type { Project } from './Project'

const pageSize = 40
export class LocatorTool {
  constructor(private readonly project: Project) {}

  public getRowsFromLocator(locator: AnyLocator): Row[] {
    const grid = locator.grid
    const rowLocators: RowLocator[] = locator instanceof RangeLocator
      ? locator.getAllRowLocators()
      : locator instanceof RowLocator
        ? [locator]
        : locator instanceof ColLocator || locator instanceof ColRangeLocator
          ? grid.gridRange.value.getAllRowLocators()
          : locator instanceof RowRangeLocator
            ? locator.getAllRowLocators()
            : [
                new RowLocator({
                  grid,
                  absRow: false,
                  row: locator.row,
                }),
              ]

    return rowLocators.map(rowLocator => grid.rows.value[rowLocator.row])
  }

  public getColsFromLocator(locator: AnyLocator): Col[] {
    const grid = locator.grid
    const colLocators: ColLocator[] = locator instanceof RangeLocator
      ? locator.getAllColLocators()
      : locator instanceof ColLocator
        ? [locator]
        : locator instanceof RowLocator || locator instanceof RowRangeLocator
          ? grid.gridRange.value.getAllColLocators()
          : locator instanceof ColRangeLocator
            ? locator.getAllColLocators()
            : [
                new ColLocator({
                  grid,
                  absCol: false,
                  col: locator.col,
                }),
              ]

    return colLocators.map(colLocator => grid.cols.value[colLocator.col])
  }

  public locate(dir: Direction, cellLocator: CellLocator, boundingRange: RangeLocator, wrap: boolean): CellLocator {
    switch (dir) {
      case 'up': return this.cellUp(cellLocator, boundingRange, wrap)
      case 'down': return this.cellDown(cellLocator, boundingRange, wrap)
      case 'right': return this.cellRight(cellLocator, boundingRange, wrap)
      case 'left': return this.cellLeft(cellLocator, boundingRange, wrap)
      case 'top': return this.cellTop(cellLocator, boundingRange)
      case 'bottom': return this.cellBottom(cellLocator, boundingRange)
      case 'leftmost': return this.cellLeftmost(cellLocator, boundingRange)
      case 'rightmost': return this.cellRightmost(cellLocator, boundingRange)
      case 'pageDown': return this.cellPageDown(cellLocator, boundingRange)
      case 'pageUp': return this.cellPageUp(cellLocator, boundingRange)
      case 'pageLeft': return this.cellPageLeft(cellLocator, boundingRange)
      case 'pageRight': return this.cellPageRight(cellLocator, boundingRange)
      default: throw new Error(`Unsupported direction: ${dir}`)
    }
  }

  public getSurroundingCorners(cellLocator: CellLocator, boundingRange: RangeLocator): CellLocator[] {
    const { startRow, startCol, endRow, endCol } = boundingRange.getCoords()

    const upperRow = Math.max(startRow, cellLocator.row - 2)
    const lowerRow = Math.min(endRow, cellLocator.row + 2)
    const leftCol = Math.max(startCol, cellLocator.col - 1)
    const rightCol = Math.min(endCol, cellLocator.col + 1)

    return [
      CellLocator.fromCoords(cellLocator.grid, { row: upperRow, col: leftCol }),
      CellLocator.fromCoords(cellLocator.grid, { row: upperRow, col: rightCol }),
      CellLocator.fromCoords(cellLocator.grid, { row: lowerRow, col: leftCol }),
      CellLocator.fromCoords(cellLocator.grid, { row: lowerRow, col: rightCol }),
    ]
  }

  public getSurroundingRows(cellLocator: CellLocator, boundingRange: RangeLocator): RowLocator[] {
    const { startRow, endRow } = boundingRange.getCoords()

    const upperRow = Math.max(startRow, cellLocator.row - 2)
    const lowerRow = Math.min(endRow, cellLocator.row + 2)

    return [
      RowLocator.fromNumber(cellLocator.grid, upperRow),
      RowLocator.fromNumber(cellLocator.grid, lowerRow),
    ]
  }

  public getSurroundingCols(cellLocator: CellLocator, boundingRange: RangeLocator): ColLocator[] {
    const { startCol, endCol } = boundingRange.getCoords()

    const leftCol = Math.max(startCol, cellLocator.col - 1)
    const rightCol = Math.min(endCol, cellLocator.col + 1)

    return [
      ColLocator.fromNumber(cellLocator.grid, leftCol),
      ColLocator.fromNumber(cellLocator.grid, rightCol),
    ]
  }

  private cellUp(cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    let row = cellLocator.row - 1
    let col = cellLocator.col
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
    return CellLocator.fromCoords(cellLocator.grid, { row, col })
  }

  private cellDown(cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    let row = cellLocator.row + 1
    let col = cellLocator.col
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
    return CellLocator.fromCoords(cellLocator.grid, { row, col })
  }

  private cellRight(cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    let row = cellLocator.row
    let col = cellLocator.col + 1
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
    return CellLocator.fromCoords(cellLocator.grid, { row, col })
  }

  private cellLeft(cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.getCoords()
    let row = cellLocator.row
    let col = cellLocator.col - 1
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
    return CellLocator.fromCoords(cellLocator.grid, { row, col })
  }

  private cellTop(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    const { startRow } = range.getCoords()
    return CellLocator.fromCoords(cellLocator.grid, { row: startRow, col: cellLocator.col })
  }

  private cellBottom(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    const { endRow } = range.getCoords()
    return CellLocator.fromCoords(cellLocator.grid, { row: endRow, col: cellLocator.col })
  }

  private cellLeftmost(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    const { startCol } = range.getCoords()
    return CellLocator.fromCoords(cellLocator.grid, { row: cellLocator.row, col: startCol })
  }

  private cellRightmost(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    const { endCol } = range.getCoords()
    return CellLocator.fromCoords(cellLocator.grid, { row: cellLocator.row, col: endCol })
  }

  private cellPageUp(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    if (!range.containsCell(cellLocator)) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopRow = Math.max(range.getCoords().startRow, cellLocator.row - pageSize)

    if (cellLocator.row === stopRow) {
      return cellLocator
    }
    const hasInput = cellLocator.getCell().input.value !== ''
    const above = this.cellUp(cellLocator, range, false)
    if (above.row === stopRow) {
      return above
    }
    const aboveHasInput = above.getCell().input.value !== ''
    if (hasInput && !aboveHasInput) {
      let current = above
      do {
        current = this.cellUp(current, range, false)
      } while (current.row !== stopRow && current.getCell().input.value === '')
      return current
    }
    else if (hasInput && aboveHasInput) {
      let previous = above
      let current = above
      do {
        previous = current
        current = this.cellUp(current, range, false)
        if (current.getCell().input.value === '') {
          return previous
        }
      } while (current.row !== stopRow)
      return current
    }
    else {
      let current = above
      while (current.row !== stopRow && current.getCell().input.value === '') {
        current = this.cellUp(current, range, false)
      }
      return current
    }
  }

  private cellPageDown(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    if (!range.containsCell(cellLocator)) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopRow = Math.min(range.getCoords().endRow, cellLocator.row + pageSize)

    if (cellLocator.row === stopRow) {
      return cellLocator
    }
    const hasInput = cellLocator.getCell().input.value !== ''
    const below = this.cellDown(cellLocator, range, false)
    if (below.row === stopRow) {
      return below
    }
    const belowHasInput = below.getCell().input.value !== ''
    if (hasInput && !belowHasInput) {
      let current = below
      do {
        current = this.cellDown(current, range, false)
      } while (current.row !== stopRow && current.getCell().input.value === '')
      return current
    }
    else if (hasInput && belowHasInput) {
      let previous = below
      let current = below
      do {
        previous = current
        current = this.cellDown(current, range, false)
        if (current.getCell().input.value === '') {
          return previous
        }
      } while (current.row !== stopRow)
      return current
    }
    else {
      let current = below
      while (current.row !== stopRow && current.getCell().input.value === '') {
        current = this.cellDown(current, range, false)
      }
      return current
    }
  }

  private cellPageLeft(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    if (!range.containsCell(cellLocator)) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopCol = Math.max(range.getCoords().startCol, cellLocator.col - pageSize)

    if (cellLocator.col === stopCol) {
      return cellLocator
    }
    const hasInput = cellLocator.getCell().input.value !== ''
    const leftOf = this.cellLeft(cellLocator, range, false)
    if (leftOf.col === stopCol) {
      return leftOf
    }
    const leftOfHasInput = leftOf.getCell().input.value !== ''
    if (hasInput && !leftOfHasInput) {
      let current = leftOf
      do {
        current = this.cellLeft(current, range, false)
      } while (current.col !== stopCol && current.getCell().input.value === '')
      return current
    }
    else if (hasInput && leftOfHasInput) {
      let previous = leftOf
      let current = leftOf
      do {
        previous = current
        current = this.cellLeft(current, range, false)
        if (current.getCell().input.value === '') {
          return previous
        }
      } while (current.col !== stopCol)
      return current
    }
    else {
      let current = leftOf
      while (current.col !== stopCol && current.getCell().input.value === '') {
        current = this.cellLeft(current, range, false)
      }
      return current
    }
  }

  private cellPageRight(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    if (!range.containsCell(cellLocator)) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }

    const stopCol = Math.min(range.getCoords().endCol, cellLocator.col + pageSize)

    if (cellLocator.col === stopCol) {
      return cellLocator
    }
    const hasInput = cellLocator.getCell().input.value !== ''
    const rightOf = this.cellRight(cellLocator, range, false)
    if (rightOf.col === stopCol) {
      return rightOf
    }
    const rightOfHasInput = rightOf.getCell().input.value !== ''
    if (hasInput && !rightOfHasInput) {
      let current = rightOf
      do {
        current = this.cellRight(current, range, false)
      } while (current.col !== stopCol && current.getCell().input.value === '')
      return current
    }
    else if (hasInput && rightOfHasInput) {
      let previous = rightOf
      let current = rightOf
      do {
        previous = current
        current = this.cellRight(current, range, false)
        if (current.getCell().input.value === '') {
          return previous
        }
      } while (current.col !== stopCol)
      return current
    }
    else {
      let current = rightOf
      while (current.col !== stopCol && current.getCell().input.value === '') {
        current = this.cellRight(current, range, false)
      }
      return current
    }
  }
}
