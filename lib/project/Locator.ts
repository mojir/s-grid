import type { Cell } from '../Cell'
import type { Col } from '../Col'
import { CellLocator } from '../locators/CellLocator'
import { ColLocator } from '../locators/ColLocator'
import { ColRangeLocator } from '../locators/ColRangeLocator'
import { RangeLocator } from '../locators/RangeLocator'
import { RowLocator } from '../locators/RowLocator'
import { RowRangeLocator } from '../locators/RowRangeLocator'
import type { ReferenceLocator, AnyLocator, Direction } from '../locators/utils'
import { matrixMap } from '../matrix'
import type { Row } from '../Row'
import type { Project } from './Project'

export class Locator {
  constructor(private readonly project: Project) {}

  public getValueFromLocator(locator: ReferenceLocator): unknown {
    const grid = this.project.getGrid(locator.gridName)
    if (!grid) {
      throw new Error(`Grid not found ${locator.toStringWithGrid()}`)
    }
    if (locator instanceof RangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof RowLocator) {
      return locator
        .getAllCellLocators(grid.cols.value.length)
        .map(cellLocator => this.getCellFromLocator(cellLocator).output.value)
    }
    else if (locator instanceof ColLocator) {
      return locator
        .getAllCellLocators(grid.rows.value.length)
        .map(cellLocator => this.getCellFromLocator(cellLocator).output.value)
    }
    else if (locator instanceof RowRangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(grid.cols.value.length),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof ColRangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(grid.rows.value.length),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof CellLocator) {
      return this.getCellFromLocator(locator).output.value
    }
  }

  public getCellFromLocator(cellLocator: CellLocator): Cell {
    const grid = this.project.getGrid(cellLocator.gridName)
    const cell = grid.cells[cellLocator.row][cellLocator.col]
    if (!cell) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is out of range`)
    }

    return cell
  }

  public getCellsFromLocator(locator: ReferenceLocator): Cell[] {
    const grid = this.project.getGrid(locator.gridName)
    return locator instanceof RangeLocator
      ? locator.getAllCellLocators().map(cellLocator => this.getCellFromLocator(cellLocator))
      : locator instanceof RowLocator
        ? locator.getAllCellLocators(grid.cols.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
        : locator instanceof ColLocator
          ? locator.getAllCellLocators(grid.rows.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
          : locator instanceof RowRangeLocator
            ? locator.getAllCellLocators(grid.cols.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
            : locator instanceof ColRangeLocator
              ? locator.getAllCellLocators(grid.rows.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
              : [this.getCellFromLocator(locator)]
  }

  public getRowsFromLocator(locator: AnyLocator): Row[] {
    const grid = this.project.getGrid(locator.gridName)
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
                  gridName: locator.gridName,
                  absRow: false,
                  row: locator.row,
                }),
              ]

    return rowLocators.map(rowLocator => grid.rows.value[rowLocator.row])
  }

  public getColsFromLocator(locator: AnyLocator): Col[] {
    const grid = this.project.getGrid(locator.gridName)
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
                  gridName: locator.gridName,
                  absCol: false,
                  col: locator.col,
                }),
              ]

    return colLocators.map(colLocator => grid.cols.value[colLocator.col])
  }

  public locate(dir: Direction, cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    switch (dir) {
      case 'up': return this.cellUp(cellLocator, range, wrap)
      case 'down': return this.cellDown(cellLocator, range, wrap)
      case 'right': return this.cellRight(cellLocator, range, wrap)
      case 'left': return this.cellLeft(cellLocator, range, wrap)
      case 'top': return this.cellTop(cellLocator, range)
      case 'bottom': return this.cellBottom(cellLocator, range)
      case 'leftmost': return this.cellLeftmost(cellLocator, range)
      case 'rightmost': return this.cellRightmost(cellLocator, range)
      case 'pageDown': return this.cellPageDown(cellLocator, range)
      case 'pageUp': return this.cellPageUp(cellLocator, range)
      case 'pageLeft': return this.cellPageLeft(cellLocator, range)
      case 'pageRight': return this.cellPageRight(cellLocator, range)
      default: throw new Error(`Unsupported direction: ${dir}`)
    }
  }

  private cellUp(cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
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
    return CellLocator.fromCoords(cellLocator.gridName, { row, col })
  }

  private cellDown(cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
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
    return CellLocator.fromCoords(cellLocator.gridName, { row, col })
  }

  private cellRight(cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
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
    return CellLocator.fromCoords(cellLocator.gridName, { row, col })
  }

  private cellLeft(cellLocator: CellLocator, range: RangeLocator, wrap: boolean): CellLocator {
    const { startRow, startCol, endRow, endCol } = range.toSorted().getCoords()
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
    return CellLocator.fromCoords(cellLocator.gridName, { row, col })
  }

  private cellTop(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    const { startRow } = range.toSorted().getCoords()
    return CellLocator.fromCoords(cellLocator.gridName, { row: startRow, col: cellLocator.col })
  }

  private cellBottom(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    const { endRow } = range.toSorted().getCoords()
    return CellLocator.fromCoords(cellLocator.gridName, { row: endRow, col: cellLocator.col })
  }

  private cellLeftmost(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    const { startCol } = range.toSorted().getCoords()
    return CellLocator.fromCoords(cellLocator.gridName, { row: cellLocator.row, col: startCol })
  }

  private cellRightmost(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    const { endCol } = range.toSorted().getCoords()
    return CellLocator.fromCoords(cellLocator.gridName, { row: cellLocator.row, col: endCol })
  }

  private cellPageUp(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    if (!range.containsCell(cellLocator)) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }
    const { startRow } = range.toSorted().getCoords()
    if (cellLocator.row === startRow) {
      return cellLocator
    }
    const hasInput = this.getCellFromLocator(cellLocator).input.value !== ''
    const above = this.cellUp(cellLocator, range, false)
    if (above.row === startRow) {
      return above
    }
    const aboveHasInput = this.getCellFromLocator(above).input.value !== ''
    if (hasInput && !aboveHasInput) {
      let current = above
      do {
        current = this.cellUp(current, range, false)
      } while (current.row !== startRow && this.getCellFromLocator(current).input.value === '')
      return current
    }
    else if (hasInput && aboveHasInput) {
      let previous = above
      let current = above
      do {
        previous = current
        current = this.cellUp(current, range, false)
        if (this.getCellFromLocator(current).input.value === '') {
          return previous
        }
      } while (current.row !== startRow)
      return current
    }
    else {
      let current = above
      while (current.row !== startRow && this.getCellFromLocator(current).input.value === '') {
        current = this.cellUp(current, range, false)
      }
      return current
    }
  }

  private cellPageDown(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    if (!range.containsCell(cellLocator)) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }
    const { endRow } = range.toSorted().getCoords()
    if (cellLocator.row === endRow) {
      return cellLocator
    }
    const hasInput = this.getCellFromLocator(cellLocator).input.value !== ''
    const below = this.cellDown(cellLocator, range, false)
    if (below.row === endRow) {
      return below
    }
    const belowHasInput = this.getCellFromLocator(below).input.value !== ''
    if (hasInput && !belowHasInput) {
      let current = below
      do {
        current = this.cellDown(current, range, false)
      } while (current.row !== endRow && this.getCellFromLocator(current).input.value === '')
      return current
    }
    else if (hasInput && belowHasInput) {
      let previous = below
      let current = below
      do {
        previous = current
        current = this.cellDown(current, range, false)
        if (this.getCellFromLocator(current).input.value === '') {
          return previous
        }
      } while (current.row !== endRow)
      return current
    }
    else {
      let current = below
      while (current.row !== endRow && this.getCellFromLocator(current).input.value === '') {
        current = this.cellDown(current, range, false)
      }
      return current
    }
  }

  private cellPageLeft(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    if (!range.containsCell(cellLocator)) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }
    const { startCol } = range.toSorted().getCoords()
    if (cellLocator.col === startCol) {
      return cellLocator
    }
    const hasInput = this.getCellFromLocator(cellLocator).input.value !== ''
    const leftOf = this.cellLeft(cellLocator, range, false)
    if (leftOf.col === startCol) {
      return leftOf
    }
    const leftOfHasInput = this.getCellFromLocator(leftOf).input.value !== ''
    if (hasInput && !leftOfHasInput) {
      let current = leftOf
      do {
        current = this.cellLeft(current, range, false)
      } while (current.col !== startCol && this.getCellFromLocator(current).input.value === '')
      return current
    }
    else if (hasInput && leftOfHasInput) {
      let previous = leftOf
      let current = leftOf
      do {
        previous = current
        current = this.cellLeft(current, range, false)
        if (this.getCellFromLocator(current).input.value === '') {
          return previous
        }
      } while (current.col !== startCol)
      return current
    }
    else {
      let current = leftOf
      while (current.col !== startCol && this.getCellFromLocator(current).input.value === '') {
        current = this.cellLeft(current, range, false)
      }
      return current
    }
  }

  private cellPageRight(cellLocator: CellLocator, range: RangeLocator): CellLocator {
    if (!range.containsCell(cellLocator)) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is not in range ${range.toStringWithGrid()}`)
    }
    const { endCol } = range.toSorted().getCoords()
    if (cellLocator.col === endCol) {
      return cellLocator
    }
    const hasInput = this.getCellFromLocator(cellLocator).input.value !== ''
    const rightOf = this.cellRight(cellLocator, range, false)
    if (rightOf.col === endCol) {
      return rightOf
    }
    const rightOfHasInput = this.getCellFromLocator(rightOf).input.value !== ''
    if (hasInput && !rightOfHasInput) {
      let current = rightOf
      do {
        current = this.cellRight(current, range, false)
      } while (current.col !== endCol && this.getCellFromLocator(current).input.value === '')
      return current
    }
    else if (hasInput && rightOfHasInput) {
      let previous = rightOf
      let current = rightOf
      do {
        previous = current
        current = this.cellRight(current, range, false)
        if (this.getCellFromLocator(current).input.value === '') {
          return previous
        }
      } while (current.col !== endCol)
      return current
    }
    else {
      let current = rightOf
      while (current.col !== endCol && this.getCellFromLocator(current).input.value === '') {
        current = this.cellRight(current, range, false)
      }
      return current
    }
  }
}
