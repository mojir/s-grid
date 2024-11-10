import type { CellJson } from '~/lib/Cell'
import { CellId } from '~/lib/CellId'
import type { CellRange } from '~/lib/CellRange'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformLits } from '~/lib/transformLits'

type Clipboard = {
  range: CellRange
  cells: CellJson[][]
}

export default function useGridClipboard() {
  const { selection } = useSelection()
  const { grid } = useGrid()
  const clipboard = ref<Clipboard | null>(null)
  const cut = ref(false)
  const cutCellIds = ref<CellId[]>([])

  function copySelection() {
    cut.value = false
    if (cutCellIds.value.length > 0) {
      cutCellIds.value = []
    }

    clipboard.value = {
      range: selection.value,
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

    const fromPosition = clipboard.value.range.start
    const toPosition = selection.value.start
    const movement = fromPosition.getMovementTo(toPosition)

    matrixForEach(clipboard.value.cells, (cellJson, [rowIndex, colIndex]) => {
      const cellId = CellId.fromCoords(toPosition.rowIndex + rowIndex, toPosition.colIndex + colIndex)
      const cell = grid.value.getCell(cellId)
      if (cellJson.input.startsWith('=')) {
        cellJson.input = `=${transformLits(cellJson.input.slice(1), movement)}`
      }
      cell.setJson(cellJson)
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
