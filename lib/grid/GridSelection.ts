import { CellLocator, isCellLocatorString } from '../locators/CellLocator'
import { ColLocator } from '../locators/ColLocator'
import { ColRangeLocator } from '../locators/ColRangeLocator'
import { RowLocator } from '../locators/RowLocator'
import { RowRangeLocator } from '../locators/RowRangeLocator'
import type { Direction, Movement } from '../locators/utils'
import type { Project } from '../project/Project'
import type { Grid } from './Grid'
import type { Row } from '~/lib/Row'
import { isRangeLocatorString, RangeLocator } from '~/lib/locators/RangeLocator'
import type { Col } from '~/lib/Col'

export class GridSelection {
  public selecting = ref(false)
  private scrollDisabled = false
  private readonly selectionEndpoints: {
    start: Ref<CellLocator>
    end: Ref<CellLocator>
  }

  constructor(private readonly project: Project, private readonly grid: Grid) {
    this.selectionEndpoints = {
      start: shallowRef(CellLocator.fromCoords(this.grid, { row: 0, col: 0 })),
      end: shallowRef(CellLocator.fromCoords(this.grid, { row: 0, col: 0 })),
    }
  }

  public isScollDisabled() {
    return this.scrollDisabled
  }

  private readonly gridRange = computed(() => {
    return RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this.grid, { row: 0, col: 0 }),
      CellLocator.fromCoords(this.grid, { row: this.grid.rows.value.length - 1, col: this.grid.cols.value.length - 1 }),
    )
  })

  public readonly selectedRange = computed(() => RangeLocator.fromCellLocators(this.selectionEndpoints.start.value, this.selectionEndpoints.end.value))
  public selectedRows = computed<RowRangeLocator | null>(() => {
    if (this.selectedRange.value.start.col === 0 && this.selectedRange.value.end.col === this.grid.cols.value.length - 1) {
      return RowRangeLocator.fromRowLocators(
        RowLocator.fromNumber(this.grid, this.selectedRange.value.start.row),
        RowLocator.fromNumber(this.grid, this.selectedRange.value.end.row),
      )
    }
    return null
  })

  public selectedCols = computed<ColRangeLocator | null>(() => {
    if (this.selectedRange.value.start.row === 0 && this.selectedRange.value.end.row === this.grid.rows.value.length - 1) {
      return ColRangeLocator.fromColLocators(
        ColLocator.fromNumber(this.grid, this.selectedRange.value.start.col),
        ColLocator.fromNumber(this.grid, this.selectedRange.value.end.col),
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
    const newStart = CellLocator.fromCoords(this.grid, {
      row: this.selectedRange.value.start.row + (movement.deltaRow ?? 0),
      col: this.selectedRange.value.start.col + (movement.deltaCol ?? 0),
    })
    const newEnd = CellLocator.fromCoords(this.grid, {
      row: this.selectedRange.value.end.row + (movement.deltaRow ?? 0),
      col: this.selectedRange.value.end.col + (movement.deltaCol ?? 0),
    })
    this.updateSelection(newStart, newEnd)
  }

  public updateSelection(start: CellLocator, end: CellLocator) {
    if (!start.equals(this.selectionEndpoints.start.value)) {
      this.selectionEndpoints.start.value = start
    }
    if (!end.equals(this.selectionEndpoints.end.value)) {
      this.selectionEndpoints.end.value = end
    }
    this.scrollDisabled = false
  }

  public expandSelection(dir: Direction) {
    const start = this.selectionEndpoints.start.value
    const end = this.project.locator.locate(dir, this.selectionEndpoints.end.value, this.gridRange.value, false)

    this.updateSelection(start, end)
  }

  public expandSelectionTo(target: CellLocator | string) {
    const start = this.selectionEndpoints.start.value
    const end = target instanceof CellLocator ? target : CellLocator.fromString(this.grid, target)

    this.updateSelection(start, end)
  }

  public selectAll() {
    this.updateSelection(this.gridRange.value.start, this.gridRange.value.end)
    this.scrollDisabled = true
  }

  public selectColRange(fromCol: Col, toCol: Col) {
    this.selectionEndpoints.start.value = CellLocator.fromCoords(this.grid, { row: 0, col: fromCol.index.value })
    this.selectionEndpoints.end.value = CellLocator.fromCoords(this.grid, { row: this.gridRange.value.end.row, col: toCol.index.value })
    this.scrollDisabled = true
  }

  public selectRowRange(fromRow: Row, toRow: Row) {
    this.selectionEndpoints.start.value = CellLocator.fromCoords(this.grid, { row: fromRow.index.value, col: 0 })
    this.selectionEndpoints.end.value = CellLocator.fromCoords(this.grid, { row: toRow.index.value, col: this.gridRange.value.end.col })
  }

  public select(target: string | RangeLocator | CellLocator) {
    const range = target instanceof RangeLocator
      ? target
      : typeof target === 'string' && isRangeLocatorString(target)
        ? RangeLocator.fromString(this.grid, target).clamp(this.gridRange.value)
        : target instanceof CellLocator
          ? target.toRangeLocator()
          : isCellLocatorString(target)
            ? RangeLocator.fromCellLocator(CellLocator.fromString(this.grid, target)).clamp(this.gridRange.value)
            : null

    if (!range) {
      throw Error(`Unable to select, invalid target: ${target}`)
    }

    this.updateSelection(range.start, range.end)
  }

  public clampSelection(range: RangeLocator) {
    const newSelectedRange = this.selectedRange.value.clamp(range)
    this.updateSelection(newSelectedRange.start, newSelectedRange.end)
  }
}
