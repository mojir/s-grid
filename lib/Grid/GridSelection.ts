import { CellLocator, isCellLocatorString } from '../locator/CellLocator'
import { getRowNumber, type RowRange } from '../locator/RowLocator'
import { getColNumber, type ColRange } from '../locator/ColLocator'
import type { Direction, Movement } from '../locator/utils'
import { isRangeLocatorString, RangeLocator } from '~/lib/locator/RangeLocator'
import type { Col } from '~/lib/Col'
import type { Grid } from '~/lib/Grid'
import type { Row } from '~/lib/Row'

export class GridSelection {
  public selecting = ref(false)

  constructor(private grid: Grid) {}

  private readonly gridRange = computed(() => {
    return RangeLocator.fromCellLocators(
      CellLocator.fromCoords({ row: 0, col: 0 }),
      CellLocator.fromCoords({ row: this.grid.rows.value.length - 1, col: this.grid.cols.value.length - 1 }),
    )
  })

  private readonly unsortedSelectedRange = ref(RangeLocator.fromCellLocator(CellLocator.fromCoords({ row: 0, col: 0 })))
  public readonly selectedRange = computed(() => this.unsortedSelectedRange.value.toSorted())
  public selectedRows = computed<RowRange | null>(() => {
    if (this.selectedRange.value.start.col === 0 && this.selectedRange.value.end.col === this.grid.cols.value.length - 1) {
      return {
        row: this.selectedRange.value.start.row,
        count: this.selectedRange.value.end.row - this.selectedRange.value.start.row + 1,
      }
    }
    return null
  })

  public selectedCols = computed<ColRange | null>(() => {
    if (this.selectedRange.value.start.row === 0 && this.selectedRange.value.end.row === this.grid.rows.value.length - 1) {
      return {
        col: this.selectedRange.value.start.col,
        count: this.selectedRange.value.end.col - this.selectedRange.value.start.col + 1,
      }
    }
    return null
  })

  public isRowSelected(rowLocator: string) {
    const row = getRowNumber(rowLocator)
    return this.selectedRows.value
      && this.selectedRows.value.row <= row
      && row < this.selectedRows.value.row + this.selectedRows.value.count
  }

  public isColSelected(colLocator: string) {
    const col = getColNumber(colLocator)
    return this.selectedCols.value
      && this.selectedCols.value.col <= col
      && col < this.selectedCols.value.col + this.selectedCols.value.count
  }

  public moveSelection(movement: Movement) {
    const newStart = CellLocator.fromCoords({
      row: this.selectedRange.value.start.row + (movement.rows ?? 0),
      col: this.selectedRange.value.start.col + (movement.cols ?? 0),
    })
    const newEnd = CellLocator.fromCoords({
      row: this.selectedRange.value.end.row + (movement.rows ?? 0),
      col: this.selectedRange.value.end.col + (movement.cols ?? 0),
    })
    this.updateSelection(RangeLocator.fromCellLocators(newStart, newEnd))
  }

  public updateSelection(newSelection: RangeLocator) {
    if (!newSelection.equals(this.unsortedSelectedRange.value)) {
      this.unsortedSelectedRange.value = newSelection
    }
  }

  public expandSelection(dir: Direction) {
    const start = this.unsortedSelectedRange.value.start
    const end = this.unsortedSelectedRange.value.end.cellMove(dir, this.gridRange.value, false)

    this.updateSelection(RangeLocator.fromCellLocators(start, end))
  }

  public expandSelectionTo(target: CellLocator | string) {
    const start = this.unsortedSelectedRange.value.start
    const end = target instanceof CellLocator ? target : CellLocator.fromString(target)

    this.updateSelection(RangeLocator.fromCellLocators(start, end))
  }

  public selectAll() {
    this.updateSelection(this.gridRange.value)
  }

  public selectColRange(fromCol: Col, toCol: Col) {
    this.unsortedSelectedRange.value
      = RangeLocator.fromCellLocators(
        CellLocator.fromCoords({ row: 0, col: fromCol.index.value }),
        CellLocator.fromCoords({ row: this.gridRange.value.end.row, col: toCol.index.value }))
  }

  public selectRowRange(fromRow: Row, toRow: Row) {
    this.unsortedSelectedRange.value
      = RangeLocator.fromCellLocators(
        CellLocator.fromCoords({ row: fromRow.index.value, col: 0 }),
        CellLocator.fromCoords({ row: toRow.index.value, col: this.gridRange.value.end.col }))
  }

  public select(target: string | RangeLocator | CellLocator) {
    const range = target instanceof RangeLocator
      ? target
      : typeof target === 'string' && isRangeLocatorString(target)
        ? RangeLocator.fromString(target).clamp(this.gridRange.value)
        : target instanceof CellLocator
          ? RangeLocator.fromCellLocator(target)
          : isCellLocatorString(target)
            ? RangeLocator.fromCellLocator(CellLocator.fromString(target)).clamp(this.gridRange.value)
            : null

    if (!range) {
      throw Error(`Unable to select, invalid target: ${target}`)
    }

    this.updateSelection(range)
  }

  public clampSelection(range: RangeLocator) {
    this.updateSelection(this.selectedRange.value.clamp(range))
  }
}
