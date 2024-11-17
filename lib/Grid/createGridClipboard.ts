import type { Grid } from '.'
import type { CellJson } from '~/lib/Cell'
import { CellId } from '~/lib/CellId'
import type { CellRange } from '~/lib/CellRange'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformGridReference } from '~/lib/transformFormula'

type InternalClipboard<T> = {
  range: CellRange
  cells: T[][]
}

export type GridClipboard = ReturnType<typeof createGridClipboard>

export function createGridClipboard(grid: Grid) {
  const { selection } = useSelection()
  const clipboard = ref<InternalClipboard<CellJson> | null>(null)
  const styleClipboard = ref<InternalClipboard<Pick<CellJson, 'style' | 'backgroundColor' | 'textColor' | 'formatter'>> | null>(null)
  const cut = ref(false)
  const cutCellIds = ref<CellId[]>([])

  const hasStyleData = computed(() => !!styleClipboard.value)

  function clearStyleClipboard() {
    styleClipboard.value = null
  }

  function copySelection() {
    cut.value = false
    if (cutCellIds.value.length > 0) {
      cutCellIds.value = []
    }

    clipboard.value = {
      range: selection.value,
      cells: matrixMap(selection.value.getCellIdMatrix(), cellId => grid.getCell(cellId).getJson()),
    }
  }

  function copyStyleSelection(range?: CellRange) {
    range ??= selection.value
    styleClipboard.value = {
      range,
      cells: matrixMap(range.getCellIdMatrix(), (cellId) => {
        const cellJson = grid.getCell(cellId).getJson()
        return {
          style: cellJson.style,
          backgroundColor: cellJson.backgroundColor,
          textColor: cellJson.textColor,
          formatter: cellJson.formatter,
        }
      }),
    }
  }

  function cutSelection() {
    copySelection()
    cut.value = true
    cutCellIds.value = selection.value.getAllCellIds()
  }

  function getPastePositions(sourceRange: CellRange, targetRange?: CellRange): CellId[] {
    targetRange ??= selection.value

    const selectionWidth = targetRange.end.colIndex - targetRange.start.colIndex + 1
    const selectionHeight = targetRange.end.rowIndex - targetRange.start.rowIndex + 1

    const rangeWidth = sourceRange.end.colIndex - sourceRange.start.colIndex + 1
    const rangeHeight = sourceRange.end.rowIndex - sourceRange.start.rowIndex + 1

    const result: CellId[] = []
    const startRow = targetRange.start.rowIndex
    const startCol = targetRange.start.colIndex
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
    if (cut.value) {
      cutPasteSelection()
    }
    else {
      copyPasteSelection()
    }
  }

  function cutPasteSelection() {
    cutCellIds.value.forEach((cellId) => {
      grid.clear(cellId)
    })

    pasteToPosition(selection.value.start)

    // TODO, this is not finished issue: https://github.com/mojir/s-grid/issues/6
    // Need to update all cells that reference the cut cells

    clipboard.value = null
    cut.value = false
    cutCellIds.value = []
  }

  function copyPasteSelection() {
    if (!clipboard.value) {
      return
    }
    getPastePositions(clipboard.value.range).forEach(pasteToPosition)
  }

  function pasteToPosition(toPosition: CellId) {
    if (!clipboard.value) {
      return
    }
    const clipboardCells = clipboard.value.cells
    const fromPosition = clipboard.value.range.start
    const movement = fromPosition.getMovementTo(toPosition)

    getPastePositions(clipboard.value.range).forEach((toPosition) => {
      matrixForEach(clipboardCells, (cellJson, [rowIndex, colIndex]) => {
        const cellId = CellId.fromCoords(toPosition.rowIndex + rowIndex, toPosition.colIndex + colIndex)
        const cell = grid.getCell(cellId)
        let input = cellJson.input
        if (input.startsWith('=')) {
          input = `=${transformGridReference(cellJson.input.slice(1), { type: 'move', movement })}`
        }
        cell.setJson({ ...cellJson, input })
      })
    })
  }

  function pasteStyleSelection(targetRange?: CellRange) {
    const styleClipboardValue = styleClipboard.value
    if (!styleClipboardValue) {
      return
    }
    styleClipboard.value = null
    getPastePositions(styleClipboardValue.range, targetRange).forEach((toPosition) => {
      matrixForEach(styleClipboardValue.cells, (cellJson, [rowIndex, colIndex]) => {
        const cellId = CellId.fromCoords(toPosition.rowIndex + rowIndex, toPosition.colIndex + colIndex)
        const cell = grid.getCell(cellId)
        cell.setJson(cellJson)
      })
    })
  }

  return {
    copySelection,
    cutSelection,
    pasteSelection,
    copyStyleSelection,
    pasteStyleSelection,
    clearStyleClipboard,
    hasStyleData,
  }
}
