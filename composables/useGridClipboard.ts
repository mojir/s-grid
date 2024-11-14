import type { CellJson } from '~/lib/Cell'
import { CellId } from '~/lib/CellId'
import type { CellRange } from '~/lib/CellRange'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformGridReference } from '~/lib/transformFormula'

type Clipboard = {
  range: CellRange
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
      range: selection.value,
      cells: matrixMap(selection.value.getCellIdMatrix(), cellId => grid.value.getCell(cellId).getJson()),
    }
  }

  function cutSelection() {
    copySelection()
    cut.value = true
    cutCellIds.value = selection.value.getAllCellIds()
  }

  function getPastePositions(): CellId[] {
    if (!clipboard.value) {
      return []
    }

    if (cut.value) {
      return [selection.value.start]
    }

    const selectionWidth = selection.value.end.colIndex - selection.value.start.colIndex + 1
    const selectionHeight = selection.value.end.rowIndex - selection.value.start.rowIndex + 1

    const range = clipboard.value.range
    const rangeWidth = range.end.colIndex - range.start.colIndex + 1
    const rangeHeight = range.end.rowIndex - range.start.rowIndex + 1

    const result: CellId[] = []
    const startRow = selection.value.start.rowIndex
    const startCol = selection.value.start.colIndex
    let row = startRow
    let col = startCol
    // Populate result arrays with the positions to paste the clipboard
    do {
      do {
        result.push(CellId.fromCoords(row, col))
        col += rangeWidth
      } while (col - startCol + rangeWidth <= selectionWidth)
      row += rangeHeight
      col = startCol
    } while (row - startRow + rangeHeight <= selectionHeight)

    return result
  }

  function pasteSelection() {
    if (!clipboard.value) {
      return
    }
    const clipboardCells = clipboard.value.cells
    const fromPosition = clipboard.value.range.start
    getPastePositions().forEach((toPosition) => {
      const movement = fromPosition.getMovementTo(toPosition)

      matrixForEach(clipboardCells, (cellJson, [rowIndex, colIndex]) => {
        const cellId = CellId.fromCoords(toPosition.rowIndex + rowIndex, toPosition.colIndex + colIndex)
        const cell = grid.value.getCell(cellId)
        let input = cellJson.input
        if (input.startsWith('=')) {
          input = `=${transformGridReference(cellJson.input.slice(1), { type: 'move', movement })}`
        }
        cell.setJson({ ...cellJson, input })
      })
    })

    // TODO, this logic is not ready yet
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
