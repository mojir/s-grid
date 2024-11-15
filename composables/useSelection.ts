import { CellId, type Movement } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import { Col, type ColIdString, type ColRange } from '~/lib/Col'
import { Row, type RowIdString, type RowRange } from '~/lib/Row'

export const useSelection = createSharedComposable(() => {
  const { rows, cols } = useRowsAndCols()
  const gridRange = computed(() => {
    return CellRange.fromDimensions(0, 0, rows.value.length - 1, cols.value.length - 1)
  })
  const unsortedSelection = ref(CellRange.fromSingleCellId(CellId.fromCoords(0, 0)))
  const selection = computed(() => unsortedSelection.value.toSorted())
  const selectedRows = computed<null | RowRange>(() => {
    if (selection.value.start.colIndex === 0 && selection.value.end.colIndex === cols.value.length - 1) {
      return {
        rowIndex: selection.value.start.rowIndex,
        count: selection.value.end.rowIndex - selection.value.start.rowIndex + 1,
      }
    }
    return null
  })
  const selectedCols = computed<null | ColRange>(() => {
    if (selection.value.start.rowIndex === 0 && selection.value.end.rowIndex === rows.value.length - 1) {
      return {
        colIndex: selection.value.start.colIndex,
        count: selection.value.end.colIndex - selection.value.start.colIndex + 1,
      }
    }
    return null
  })
  function isRowSelected(row: RowIdString) {
    const rowIndex = Row.getRowIndexFromId(row)
    return selectedRows.value
      && selectedRows.value.rowIndex <= rowIndex
      && rowIndex < selectedRows.value.rowIndex + selectedRows.value.count
  }
  function isColSelected(col: ColIdString) {
    const colIndex = Col.getColIndexFromId(col)
    return selectedCols.value
      && selectedCols.value.colIndex <= colIndex
      && colIndex < selectedCols.value.colIndex + selectedCols.value.count
  }

  const selecting = ref(false)

  function moveSelection(movement: Movement) {
    const newStart = CellId.fromCoords(selection.value.start.rowIndex + movement.rows, selection.value.start.colIndex + movement.cols)
    const newEnd = CellId.fromCoords(selection.value.end.rowIndex + movement.rows, selection.value.end.colIndex + movement.cols)
    updateSelection(CellRange.fromCellIds(newStart, newEnd))
  }

  function updateSelection(newSelection: CellRange) {
    if (!newSelection.equals(unsortedSelection.value)) {
      unsortedSelection.value = newSelection
    }
  }

  function expandSelection(dir: Direction) {
    const start = unsortedSelection.value.start
    const end = unsortedSelection.value.end.cellMove(dir, gridRange.value, false)

    updateSelection(CellRange.fromCellIds(start, end))
  }

  function expandSelectionTo(target: CellId | string) {
    const start = unsortedSelection.value.start
    const end = CellId.isCellId(target) ? target : CellId.fromId(target)

    updateSelection(CellRange.fromCellIds(start, end))
  }

  function selectAll() {
    updateSelection(gridRange.value)
  }

  function selectColRange(fromCol: Col, toCol: Col) {
    unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(0, fromCol.index.value),
        CellId.fromCoords(gridRange.value.end.rowIndex, toCol.index.value))
  }

  function selectRowRange(fromRow: Row, toRow: Row) {
    unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(fromRow.index.value, 0),
        CellId.fromCoords(toRow.index.value, gridRange.value.end.colIndex))
  }

  function select(target: string | CellRange | CellId) {
    const range = CellRange.isCellRange(target)
      ? target
      : typeof target === 'string' && CellRange.isCellRangeString(target)
        ? CellRange.fromId(target).clamp(gridRange.value)
        : CellId.isCellId(target)
          ? CellRange.fromSingleCellId(target).clamp(gridRange.value)
          : CellId.isCellIdString(target)
            ? CellRange.fromSingleCellId(CellId.fromId(target)).clamp(gridRange.value)
            : null

    if (!range) {
      throw Error(`Unable to select, invalid target: ${target}`)
    }

    updateSelection(range)
  }

  function clampSelection(range: CellRange) {
    updateSelection(selection.value.clamp(range))
  }

  return {
    selection,
    updateSelection,
    expandSelection,
    expandSelectionTo,
    selectColRange,
    selectRowRange,
    select,
    selectAll,
    selecting,
    isRowSelected,
    isColSelected,
    selectedRows,
    selectedCols,
    moveSelection,
    clampSelection,
  }
})

export type SelectionComposable = ReturnType<typeof useSelection>
