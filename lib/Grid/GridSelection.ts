import { CellLocator, isCellLocatorString } from '../locator/CellLocator'
import { ColLocator } from '../locator/ColLocator'
import { ColRangeLocator } from '../locator/ColRangeLocator'
import { RowLocator } from '../locator/RowLocator'
import { RowRangeLocator } from '../locator/RowRangeLocator'
import type { Direction, Movement } from '../locator/utils'
import type { Row } from '~/lib/Row'
import { isRangeLocatorString, RangeLocator } from '~/lib/locator/RangeLocator'
import type { Grid } from '~/lib/Grid'
import type { Col } from '~/lib/Col'

export class GridSelection {
  public selecting = ref(false)
  private readonly unsortedSelectedRange: Ref<RangeLocator>

  constructor(private grid: Grid) {
    this.unsortedSelectedRange = ref(RangeLocator.fromCellLocator(CellLocator.fromCoords(this.grid.name.value, { row: 0, col: 0 })))
  }

  private readonly gridRange = computed(() => {
    return RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this.grid.name.value, { row: 0, col: 0 }),
      CellLocator.fromCoords(this.grid.name.value, { row: this.grid.rows.value.length - 1, col: this.grid.cols.value.length - 1 }),
    )
  })

  public readonly selectedRange = computed(() => this.unsortedSelectedRange.value.toSorted())
  public selectedRows = computed<RowRangeLocator | null>(() => {
    if (this.selectedRange.value.start.col === 0 && this.selectedRange.value.end.col === this.grid.cols.value.length - 1) {
      return RowRangeLocator.fromRowLocators(
        RowLocator.fromNumber(this.grid.name.value, this.selectedRange.value.start.row),
        RowLocator.fromNumber(this.grid.name.value, this.selectedRange.value.end.row),
      )
    }
    return null
  })

  public selectedCols = computed<ColRangeLocator | null>(() => {
    if (this.selectedRange.value.start.row === 0 && this.selectedRange.value.end.row === this.grid.rows.value.length - 1) {
      return ColRangeLocator.fromColLocators(
        ColLocator.fromNumber(this.grid.name.value, this.selectedRange.value.start.col),
        ColLocator.fromNumber(this.grid.name.value, this.selectedRange.value.end.col),
      )
    }
    return null
  })

  public isRowSelected(row: number): boolean {
    return this.selectedRows.value?.containsRow(row) ?? false
  }

  public isColSelected(col: number) {
    return this.selectedCols.value?.containsCol(col) ?? false
  }

  public moveSelection(movement: Movement) {
    const newStart = CellLocator.fromCoords(this.grid.name.value, {
      row: this.selectedRange.value.start.row + (movement.deltaRow ?? 0),
      col: this.selectedRange.value.start.col + (movement.deltaCol ?? 0),
    })
    const newEnd = CellLocator.fromCoords(this.grid.name.value, {
      row: this.selectedRange.value.end.row + (movement.deltaRow ?? 0),
      col: this.selectedRange.value.end.col + (movement.deltaCol ?? 0),
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
    const end = target instanceof CellLocator ? target : CellLocator.fromString(this.grid.name.value, target)

    this.updateSelection(RangeLocator.fromCellLocators(start, end))
  }

  public selectAll() {
    this.updateSelection(this.gridRange.value)
  }

  public selectColRange(fromCol: Col, toCol: Col) {
    this.unsortedSelectedRange.value
      = RangeLocator.fromCellLocators(
        CellLocator.fromCoords(this.grid.name.value, { row: 0, col: fromCol.index.value }),
        CellLocator.fromCoords(this.grid.name.value, { row: this.gridRange.value.end.row, col: toCol.index.value }))
  }

  public selectRowRange(fromRow: Row, toRow: Row) {
    this.unsortedSelectedRange.value
      = RangeLocator.fromCellLocators(
        CellLocator.fromCoords(this.grid.name.value, { row: fromRow.index.value, col: 0 }),
        CellLocator.fromCoords(this.grid.name.value, { row: toRow.index.value, col: this.gridRange.value.end.col }))
  }

  public select(target: string | RangeLocator | CellLocator) {
    const range = target instanceof RangeLocator
      ? target
      : typeof target === 'string' && isRangeLocatorString(target)
        ? RangeLocator.fromString(this.grid.name.value, target).clamp(this.gridRange.value)
        : target instanceof CellLocator
          ? RangeLocator.fromCellLocator(target)
          : isCellLocatorString(target)
            ? RangeLocator.fromCellLocator(CellLocator.fromString(this.grid.name.value, target)).clamp(this.gridRange.value)
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
