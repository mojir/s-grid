import type { CellJson } from '~/lib/Cell'
import { CellId } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformGridReference } from '~/lib/transformFormula'

type Clipboard = {
  rangeId: string
  cells: CellJson[][]
}

export default function useGridClipboard() {
  const { selection } = useSelection()
  const grid = useGrid()
  const clipboard = ref<Clipboard | null>(null)
  const cut = ref(false)
  const cutCellIds = ref<CellId[]>([])

  function copySelection() {
    cut.value = false
    if (cutCellIds.value.length > 0) {
      cutCellIds.value = []
    }

    clipboard.value = {
      rangeId: selection.value.id,
      cells: matrixMap(selection.value.getCellIdMatrix(), cellId => grid.value.getCell(cellId).getJson()),
    }
  }

  function cutSelection() {
    copySelection()
    cut.value = true
    cutCellIds.value = selection.value.getAllCellIds()
  }

  function pasteSelection() {
    if (!clipboard.value) {
      return
    }

    const range = CellRange.fromId(clipboard.value.rangeId)
    const fromPosition = range.start
    const toPosition = selection.value.start
    const movement = fromPosition.getMovementTo(toPosition)

    matrixForEach(clipboard.value.cells, (cellJson, [rowIndex, colIndex]) => {
      const cellId = CellId.fromCoords(toPosition.rowIndex + rowIndex, toPosition.colIndex + colIndex)
      const cell = grid.value.getCell(cellId)
      let input = cellJson.input
      if (input.startsWith('=')) {
        input = `=${transformGridReference(cellJson.input.slice(1), { type: 'move', movement })}`
      }
      cell.setJson({ ...cellJson, input })
    })

    if (cut.value) {
      cutCellIds.value.forEach((cellId) => {
        grid.value.clear(cellId)
      })
    }

    cut.value = false
    cutCellIds.value = []
  }

  return {
    copySelection,
    cutSelection,
    pasteSelection,
  }
}
