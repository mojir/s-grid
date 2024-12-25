import { CellReference, isCellReferenceString } from '../reference/CellReference'
import type { Direction, Movement } from '../reference/utils'
import type { Project } from '../project/Project'
import type { Grid } from './Grid'
import type { Row } from '~/lib/Row'
import { isRangeReferenceString, RangeReference } from '~/lib/reference/RangeReference'
import type { Col } from '~/lib/Col'

export class GridSelection {
  public selecting = ref(false)
  private scrollDisabled = false
  private readonly selectionEndpoints: {
    start: Ref<CellReference>
    end: Ref<CellReference>
  }

  constructor(private readonly project: Project, private readonly grid: Grid) {
    this.selectionEndpoints = {
      start: shallowRef(CellReference.fromCoords(this.grid, { row: 0, col: 0 })),
      end: shallowRef(CellReference.fromCoords(this.grid, { row: 0, col: 0 })),
    }
  }

  public isScollDisabled() {
    return this.scrollDisabled
  }

  private readonly gridRange = computed(() => {
    return RangeReference.fromCellReferences(
      CellReference.fromCoords(this.grid, { row: 0, col: 0 }),
      CellReference.fromCoords(this.grid, { row: this.grid.rows.value.length - 1, col: this.grid.cols.value.length - 1 }),
    )
  })

  public readonly selectedRange = computed(() => RangeReference.fromCellReferences(this.selectionEndpoints.start.value, this.selectionEndpoints.end.value))
  public selectedRows = computed<RangeReference | null>(() => {
    if (this.selectedRange.value.start.col === 0 && this.selectedRange.value.end.col === this.grid.cols.value.length - 1) {
      return this.selectedRange.value
    }
    return null
  })

  public selectedCols = computed<RangeReference | null>(() => {
    if (this.selectedRange.value.start.row === 0 && this.selectedRange.value.end.row === this.grid.rows.value.length - 1) {
      return this.selectedRange.value
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
    const newStart = CellReference.fromCoords(this.grid, {
      row: this.selectedRange.value.start.row + (movement.deltaRow ?? 0),
      col: this.selectedRange.value.start.col + (movement.deltaCol ?? 0),
    })
    const newEnd = CellReference.fromCoords(this.grid, {
      row: this.selectedRange.value.end.row + (movement.deltaRow ?? 0),
      col: this.selectedRange.value.end.col + (movement.deltaCol ?? 0),
    })
    this.updateSelection(newStart, newEnd)
  }

  public updateSelection(start: CellReference, end: CellReference) {
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
    const end = this.selectionEndpoints.end.value.moveInDirection(dir, this.gridRange.value, false)

    this.updateSelection(start, end)
  }

  public expandSelectionTo(target: CellReference | string) {
    const start = this.selectionEndpoints.start.value
    const end = target instanceof CellReference ? target : CellReference.fromString(this.grid, target)

    this.updateSelection(start, end)
  }

  public selectAll() {
    this.updateSelection(this.gridRange.value.start, this.gridRange.value.end)
    this.scrollDisabled = true
  }

  public selectColRange(fromCol: Col, toCol: Col) {
    this.selectionEndpoints.start.value = CellReference.fromCoords(this.grid, { row: 0, col: fromCol.index.value })
    this.selectionEndpoints.end.value = CellReference.fromCoords(this.grid, { row: this.gridRange.value.end.row, col: toCol.index.value })
    this.scrollDisabled = true
  }

  public selectRowRange(fromRow: Row, toRow: Row) {
    this.selectionEndpoints.start.value = CellReference.fromCoords(this.grid, { row: fromRow.index.value, col: 0 })
    this.selectionEndpoints.end.value = CellReference.fromCoords(this.grid, { row: toRow.index.value, col: this.gridRange.value.end.col })
  }

  public select(target: string | RangeReference | CellReference) {
    const range = target instanceof RangeReference
      ? target
      : typeof target === 'string' && isRangeReferenceString(target)
        ? RangeReference.fromString(this.grid, target).clamp(this.gridRange.value)
        : target instanceof CellReference
          ? target.toRangeReference()
          : isCellReferenceString(target)
            ? RangeReference.fromCellReference(CellReference.fromString(this.grid, target)).clamp(this.gridRange.value)
            : null

    if (!range) {
      throw Error(`Unable to select, invalid target: ${target}`)
    }

    this.updateSelection(range.start, range.end)
  }

  public clampSelection(range: RangeReference) {
    const newSelectedRange = this.selectedRange.value.clamp(range)
    this.updateSelection(newSelectedRange.start, newSelectedRange.end)
  }
}
