import { CellReference } from '../reference/CellReference'
import type { Direction, Movement } from '../reference/utils'
import type { Project } from '../project/Project'
import type { Grid } from './Grid'
import type { Row } from '~/lib/Row'
import { RangeReference } from '~/lib/reference/RangeReference'
import type { Col } from '~/lib/Col'

export class GridSelection {
  private logInfo = useDebug().createInfoLogger('Selection', 400)
  private scrollDisabled = false
  private readonly selectionEndpoints: {
    start: Ref<CellReference>
    end: Ref<CellReference>
  }

  constructor(private readonly project: Project, private readonly grid: Grid) {
    this.selectionEndpoints = {
      start: shallowRef(CellReference.fromCoords(this.grid, { rowIndex: 0, colIndex: 0 })),
      end: shallowRef(CellReference.fromCoords(this.grid, { rowIndex: 0, colIndex: 0 })),
    }
    watch(this.selectedRange, (range) => {
      this.logInfo(range.getCellMatrix().map(cell => cell.getDTO().input).stringify('Selected range'))
    })
  }

  public isScollDisabled() {
    return this.scrollDisabled
  }

  private readonly gridRange = computed(() => {
    return RangeReference.fromCellReferences(
      CellReference.fromCoords(this.grid, { rowIndex: 0, colIndex: 0 }),
      CellReference.fromCoords(this.grid, { rowIndex: this.grid.rows.value.length - 1, colIndex: this.grid.cols.value.length - 1 }),
    )
  })

  public readonly selectedRange = computed(() => RangeReference.fromCellReferences(this.selectionEndpoints.start.value, this.selectionEndpoints.end.value))

  public selectedRows = computed<RangeReference | null>(() => {
    if (this.selectedRange.value.start.colIndex === 0 && this.selectedRange.value.end.colIndex === this.grid.cols.value.length - 1) {
      return this.selectedRange.value
    }
    return null
  })

  public selectedCols = computed<RangeReference | null>(() => {
    if (this.selectedRange.value.start.rowIndex === 0 && this.selectedRange.value.end.rowIndex === this.grid.rows.value.length - 1) {
      return this.selectedRange.value
    }
    return null
  })

  public isRowSelected(rowIndex: number): boolean {
    return this.selectedRows.value?.containsRowIndex(rowIndex) ?? false
  }

  public isColSelected(colIndex: number) {
    return this.selectedCols.value?.containsColIndex(colIndex) ?? false
  }

  public moveSelection(movement: Movement) {
    const newStart = CellReference.fromCoords(this.grid, {
      rowIndex: this.selectedRange.value.start.rowIndex + (movement.deltaRow ?? 0),
      colIndex: this.selectedRange.value.start.colIndex + (movement.deltaCol ?? 0),
    })
    const newEnd = CellReference.fromCoords(this.grid, {
      rowIndex: this.selectedRange.value.end.rowIndex + (movement.deltaRow ?? 0),
      colIndex: this.selectedRange.value.end.colIndex + (movement.deltaCol ?? 0),
    })
    this.updateSelection(newStart, newEnd)
  }

  public updateSelection(start: CellReference, end?: CellReference) {
    if (!start.equals(this.selectionEndpoints.start.value)) {
      this.selectionEndpoints.start.value = start
    }
    const endPoint = end ?? start
    if (!endPoint.equals(this.selectionEndpoints.end.value)) {
      this.selectionEndpoints.end.value = endPoint
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
    this.selectionEndpoints.start.value = CellReference.fromCoords(this.grid, { rowIndex: 0, colIndex: fromCol.index.value })
    this.selectionEndpoints.end.value = CellReference.fromCoords(this.grid, { rowIndex: this.gridRange.value.end.rowIndex, colIndex: toCol.index.value })
    this.scrollDisabled = true
  }

  public selectRowRange(fromRow: Row, toRow: Row) {
    this.selectionEndpoints.start.value = CellReference.fromCoords(this.grid, { rowIndex: fromRow.index.value, colIndex: 0 })
    this.selectionEndpoints.end.value = CellReference.fromCoords(this.grid, { rowIndex: toRow.index.value, colIndex: this.gridRange.value.end.colIndex })
    this.scrollDisabled = true
  }

  public clampSelection(range: RangeReference) {
    const newSelectedRange = this.selectedRange.value.clamp(range)
    this.updateSelection(newSelectedRange.start, newSelectedRange.end)
  }
}
