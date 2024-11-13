import { CellId } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import type { Col } from '~/lib/Col'
import type { Row } from '~/lib/Row'

export const useSelection = createSharedComposable(() => {
  const { rows, cols } = useRowsAndCols()
  const gridRange = computed(() => {
    return CellRange.fromDimensions(0, 0, rows.value.length - 1, cols.value.length - 1)
  })
  const unsortedSelection = ref(CellRange.fromSingleCellId(CellId.fromCoords(0, 0)))
  const selection = computed(() => unsortedSelection.value.toSorted())
  const selecting = ref(false)

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
  }
})

export type SelectionComposable = ReturnType<typeof useSelection>
