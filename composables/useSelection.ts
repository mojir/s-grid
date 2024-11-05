import { CellId } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import type { Col } from '~/lib/Col'
import type { Row } from '~/lib/Row'

export const useSelection = createSharedComposable(() => {
  const { rows, cols } = useRowsAndCols()
  const { registerCommand } = useCommandCenter()
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

  function selectAll() {
    updateSelection(gridRange.value)
  }

  function selectColRange(fromCol: Col, toCol: Col) {
    unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(0, fromCol.index),
        CellId.fromCoords(gridRange.value.end.rowIndex, toCol.index))
  }

  function selectRowRange(fromRow: Row, toRow: Row) {
    unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(fromRow.index, 0),
        CellId.fromCoords(toRow.index, gridRange.value.end.colIndex))
  }

  registerCommand({
    name: 'GetSelection',
    execute: () => selection.value.getJson(),
    description: 'Get the current selection.',
  })

  registerCommand({
    name: 'ExpandSelection!',
    execute: (direction: Direction) => {
      expandSelection(direction)
    },
    description: 'Expand the selection one step in a specific direction',
  })

  registerCommand({
    name: 'Select!',
    execute: (target: string) => {
      select(target)
    },
    description: 'Select a cell or a range',
  })

  function select(target: string | CellRange | CellId) {
    const range = CellRange.isCellRange(target)
      ? target
      : CellRange.isCellRangeString(target)
        ? CellRange.fromId(target).clamp(gridRange.value)
        : CellId.isCellId(target)
          ? CellRange.fromSingleCellId(target).clamp(gridRange.value)
          : CellId.isCellIdString(target)
            ? CellRange.fromSingleCellId(CellId.fromId(target)).clamp(gridRange.value)
            : null

    if (!range) {
      console.error(`Unable to select, invalid target: ${target}`)
      return
    }

    updateSelection(range)
  }

  return {
    selection,
    updateSelection,
    expandSelection,
    selectColRange,
    selectRowRange,
    select,
    selectAll,
    selecting,
  }
})
