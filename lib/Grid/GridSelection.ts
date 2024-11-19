import { CellId, type Movement } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import { Col, type ColIdString, type ColRange } from '~/lib/Col'
import type { Grid } from '~/lib/Grid'
import { Row, type RowIdString, type RowRange } from '~/lib/Row'

export class GridSelection {
  public selecting = ref(false)

  constructor(private grid: Grid) {}

  private readonly gridRange = computed(() => {
    return CellRange.fromDimensions(0, 0, this.grid.rows.value.length - 1, this.grid.cols.value.length - 1)
  })

  private readonly unsortedSelectedRange = ref(CellRange.fromSingleCellId(CellId.fromCoords(0, 0)))
  public readonly selectedRange = computed(() => this.unsortedSelectedRange.value.toSorted())
  public selectedRows = computed<null | RowRange>(() => {
    if (this.selectedRange.value.start.colIndex === 0 && this.selectedRange.value.end.colIndex === this.grid.cols.value.length - 1) {
      return {
        rowIndex: this.selectedRange.value.start.rowIndex,
        count: this.selectedRange.value.end.rowIndex - this.selectedRange.value.start.rowIndex + 1,
      }
    }
    return null
  })

  public selectedCols = computed<null | ColRange>(() => {
    if (this.selectedRange.value.start.rowIndex === 0 && this.selectedRange.value.end.rowIndex === this.grid.rows.value.length - 1) {
      return {
        colIndex: this.selectedRange.value.start.colIndex,
        count: this.selectedRange.value.end.colIndex - this.selectedRange.value.start.colIndex + 1,
      }
    }
    return null
  })

  public isRowSelected(row: RowIdString) {
    const rowIndex = Row.getRowIndexFromId(row)
    return this.selectedRows.value
      && this.selectedRows.value.rowIndex <= rowIndex
      && rowIndex < this.selectedRows.value.rowIndex + this.selectedRows.value.count
  }

  public isColSelected(col: ColIdString) {
    const colIndex = Col.getColIndexFromId(col)
    return this.selectedCols.value
      && this.selectedCols.value.colIndex <= colIndex
      && colIndex < this.selectedCols.value.colIndex + this.selectedCols.value.count
  }

  public moveSelection(movement: Movement) {
    const newStart = CellId.fromCoords(this.selectedRange.value.start.rowIndex + movement.rows, this.selectedRange.value.start.colIndex + movement.cols)
    const newEnd = CellId.fromCoords(this.selectedRange.value.end.rowIndex + movement.rows, this.selectedRange.value.end.colIndex + movement.cols)
    this.updateSelection(CellRange.fromCellIds(newStart, newEnd))
  }

  public updateSelection(newSelection: CellRange) {
    if (!newSelection.equals(this.unsortedSelectedRange.value)) {
      this.unsortedSelectedRange.value = newSelection
    }
  }

  public expandSelection(dir: Direction) {
    const start = this.unsortedSelectedRange.value.start
    const end = this.unsortedSelectedRange.value.end.cellMove(dir, this.gridRange.value, false)

    this.updateSelection(CellRange.fromCellIds(start, end))
  }

  public expandSelectionTo(target: CellId | string) {
    const start = this.unsortedSelectedRange.value.start
    const end = CellId.isCellId(target) ? target : CellId.fromId(target)

    this.updateSelection(CellRange.fromCellIds(start, end))
  }

  public selectAll() {
    this.updateSelection(this.gridRange.value)
  }

  public selectColRange(fromCol: Col, toCol: Col) {
    this.unsortedSelectedRange.value
      = CellRange.fromCellIds(
        CellId.fromCoords(0, fromCol.index.value),
        CellId.fromCoords(this.gridRange.value.end.rowIndex, toCol.index.value))
  }

  public selectRowRange(fromRow: Row, toRow: Row) {
    this.unsortedSelectedRange.value
      = CellRange.fromCellIds(
        CellId.fromCoords(fromRow.index.value, 0),
        CellId.fromCoords(toRow.index.value, this.gridRange.value.end.colIndex))
  }

  public select(target: string | CellRange | CellId) {
    const range = CellRange.isCellRange(target)
      ? target
      : typeof target === 'string' && CellRange.isCellRangeString(target)
        ? CellRange.fromId(target).clamp(this.gridRange.value)
        : CellId.isCellId(target)
          ? CellRange.fromSingleCellId(target).clamp(this.gridRange.value)
          : CellId.isCellIdString(target)
            ? CellRange.fromSingleCellId(CellId.fromId(target)).clamp(this.gridRange.value)
            : null

    if (!range) {
      throw Error(`Unable to select, invalid target: ${target}`)
    }

    this.updateSelection(range)
  }

  public clampSelection(range: CellRange) {
    this.updateSelection(this.selectedRange.value.clamp(range))
  }
}
