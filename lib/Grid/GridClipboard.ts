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

export class GridClipboard {
  private readonly selection: Ref<CellRange>
  private clipboard = ref<InternalClipboard<CellJson> | null>(null)
  private styleClipboard = ref<InternalClipboard<Pick<CellJson, 'style' | 'backgroundColor' | 'textColor' | 'formatter'>> | null>(null)
  private cutCellIds = ref<CellId[] | null>(null)
  public hasStyleData = computed(() => !!this.styleClipboard.value)

  constructor(private grid: Grid) {
    this.selection = useSelection().selection
  }

  public clearStyleClipboard() {
    this.styleClipboard.value = null
  }

  public copySelection() {
    if (this.cutCellIds.value !== null) {
      this.cutCellIds.value = null
    }

    this.clipboard.value = {
      range: this.selection.value,
      cells: matrixMap(this.selection.value.getCellIdMatrix(), cellId => this.grid.getCell(cellId).getJson()),
    }
  }

  public copyStyleSelection(range?: CellRange) {
    range ??= this.selection.value
    this.styleClipboard.value = {
      range,
      cells: matrixMap(range.getCellIdMatrix(), (cellId) => {
        const cellJson = this.grid.getCell(cellId).getJson()
        return {
          style: cellJson.style,
          backgroundColor: cellJson.backgroundColor,
          textColor: cellJson.textColor,
          formatter: cellJson.formatter,
        }
      }),
    }
  }

  public cutSelection() {
    this.copySelection()
    this.cutCellIds.value = this.selection.value.getAllCellIds()
  }

  public pasteSelection() {
    if (this.cutCellIds.value) {
      this.cutPasteSelection()
    }
    else {
      this.copyPasteSelection()
    }
  }

  public pasteStyleSelection(targetRange?: CellRange) {
    const styleClipboardValue = this.styleClipboard.value
    if (!styleClipboardValue) {
      return
    }
    this.styleClipboard.value = null
    this.getPastePositions(styleClipboardValue.range, targetRange).forEach((toPosition) => {
      matrixForEach(styleClipboardValue.cells, (cellJson, [rowIndex, colIndex]) => {
        const cellId = CellId.fromCoords(toPosition.rowIndex + rowIndex, toPosition.colIndex + colIndex)
        const cell = this.grid.getCell(cellId)
        cell.setJson(cellJson)
      })
    })
  }

  private getPastePositions(sourceRange: CellRange, targetRange?: CellRange): CellId[] {
    targetRange ??= this.selection.value

    const selectionWidth = targetRange.end.colIndex - targetRange.start.colIndex + 1
    const selectionHeight = targetRange.end.rowIndex - targetRange.start.rowIndex + 1

    const rangeWidth = sourceRange.end.colIndex - sourceRange.start.colIndex + 1
    const rangeHeight = sourceRange.end.rowIndex - sourceRange.start.rowIndex + 1

    const result: CellId[] = []
    const startRow = targetRange.start.rowIndex
    const startCol = targetRange.start.colIndex
    let row = startRow
    let col = startCol
    // Populate result array with the positions (CellId) to paste the clipboard
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

  private cutPasteSelection() {
    if (!this.cutCellIds.value || !this.clipboard.value) {
      return
    }

    this.cutCellIds.value.forEach((cellId) => {
      this.grid.clear(cellId)
    })

    const toPosition = this.selection.value.start

    const clipboardCells = this.clipboard.value.cells
    matrixForEach(clipboardCells, (cellJson, [rowIndex, colIndex]) => {
      const cellId = CellId.fromCoords(toPosition.rowIndex + rowIndex, toPosition.colIndex + colIndex)
      const cell = this.grid.getCell(cellId)
      cell.setJson(cellJson)
    })

    const fromRange = this.clipboard.value.range
    const fromPosition = fromRange.start
    const movement = fromPosition.getMovementTo(toPosition)
    this.grid.gridRange.value.getAllCellIds()
      .filter(cellId => !this.cutCellIds.value!.includes(cellId))
      .forEach((cellId) => {
        const cell = this.grid.getCell(cellId)
        let input = cell.input.value
        if (input.startsWith('=')) {
          input = `=${transformGridReference(input.slice(1), { type: 'move', movement, range: fromRange })}`
        }
        if (input !== cell.input.value) {
          cell.input.value = input
        }
      })

    this.clipboard.value = null
    this.cutCellIds.value = null
  }

  private copyPasteSelection() {
    if (!this.clipboard.value) {
      return
    }
    this.getPastePositions(this.clipboard.value.range).forEach(toPosition => this.pasteToPosition(toPosition))
  }

  private pasteToPosition(toPosition: CellId) {
    if (!this.clipboard.value) {
      return
    }
    const clipboardCells = this.clipboard.value.cells
    const fromPosition = this.clipboard.value.range.start
    const movement = fromPosition.getMovementTo(toPosition)

    this.getPastePositions(this.clipboard.value.range).forEach((toPosition) => {
      matrixForEach(clipboardCells, (cellJson, [rowIndex, colIndex]) => {
        const cellId = CellId.fromCoords(toPosition.rowIndex + rowIndex, toPosition.colIndex + colIndex)
        const cell = this.grid.getCell(cellId)
        let input = cellJson.input
        if (input.startsWith('=')) {
          input = `=${transformGridReference(cellJson.input.slice(1), { type: 'move', movement })}`
        }
        cell.setJson({ ...cellJson, input })
      })
    })
  }
}
