import { CellLocator } from '../locator/CellLocator'
import { getMovement } from '../locator/utils'
import type { Grid } from '.'
import type { CellJson } from '~/lib/Cell'
import type { RangeLocator } from '~/lib/locator/RangeLocator'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformGridReference } from '~/lib/transformFormula'

type InternalClipboard<T> = {
  range: RangeLocator
  cells: T[][]
}

export class GridClipboard {
  private readonly selectedRange: Ref<RangeLocator>
  private clipboard = ref<InternalClipboard<CellJson> | null>(null)
  private styleClipboard = ref<InternalClipboard<Pick<CellJson, 'style' | 'backgroundColor' | 'textColor' | 'formatter'>> | null>(null)
  private cutCellIds = ref<CellLocator[] | null>(null)
  public hasStyleData = computed(() => !!this.styleClipboard.value)

  constructor(private grid: Grid) {
    this.selectedRange = grid.selection.selectedRange
  }

  public clearStyleClipboard() {
    this.styleClipboard.value = null
  }

  public copySelection() {
    if (this.cutCellIds.value !== null) {
      this.cutCellIds.value = null
    }

    this.clipboard.value = {
      range: this.selectedRange.value,
      cells: matrixMap(this.selectedRange.value.getCellIdMatrix(), cellLocator => this.grid.getCell(cellLocator).getJson()),
    }
  }

  public copyStyleSelection(range?: RangeLocator) {
    range ??= this.selectedRange.value
    this.styleClipboard.value = {
      range,
      cells: matrixMap(range.getCellIdMatrix(), (cellLocator) => {
        const cellJson = this.grid.getCell(cellLocator).getJson()
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
    this.cutCellIds.value = this.selectedRange.value.getAllCellLocators()
  }

  public pasteSelection() {
    if (this.cutCellIds.value) {
      this.cutPasteSelection()
    }
    else {
      this.copyPasteSelection()
    }
  }

  public pasteStyleSelection(targetRange?: RangeLocator) {
    const styleClipboardValue = this.styleClipboard.value
    if (!styleClipboardValue) {
      return
    }
    this.styleClipboard.value = null
    this.getPastePositions(styleClipboardValue.range, targetRange).forEach((toPosition) => {
      matrixForEach(styleClipboardValue.cells, (cellJson, [row, col]) => {
        const cellLocator = CellLocator.fromCoords({ row: toPosition.row + row, col: toPosition.col + col })
        const cell = this.grid.getCell(cellLocator)
        cell.setJson(cellJson)
      })
    })
  }

  private getPastePositions(sourceRange: RangeLocator, targetRange?: RangeLocator): CellLocator[] {
    targetRange ??= this.selectedRange.value

    const selectionWidth = targetRange.end.col - targetRange.start.col + 1
    const selectionHeight = targetRange.end.row - targetRange.start.row + 1

    const rangeWidth = sourceRange.end.col - sourceRange.start.col + 1
    const rangeHeight = sourceRange.end.row - sourceRange.start.row + 1

    const result: CellLocator[] = []
    const startRow = targetRange.start.row
    const startCol = targetRange.start.col
    let row = startRow
    let col = startCol
    // Populate result array with the positions (CellLocator) to paste the clipboard
    do {
      do {
        result.push(CellLocator.fromCoords({ row, col }))
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

    this.cutCellIds.value.forEach((cellLocator) => {
      this.grid.clear(cellLocator)
    })

    const toPosition = this.selectedRange.value.start

    const clipboardCells = this.clipboard.value.cells
    matrixForEach(clipboardCells, (cellJson, [row, col]) => {
      const cellLocator = CellLocator.fromCoords({ row: toPosition.row + row, col: toPosition.col + col })
      const cell = this.grid.getCell(cellLocator)
      cell.setJson(cellJson)
    })

    const fromRange = this.clipboard.value.range
    const fromPosition = fromRange.start
    const movement = getMovement(fromPosition, toPosition)
    this.grid.gridRange.value.getAllCellLocators()
      .filter(cellLocator => !this.cutCellIds.value!.includes(cellLocator))
      .forEach((cellLocator) => {
        const cell = this.grid.getCell(cellLocator)
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

  private pasteToPosition(toPosition: CellLocator) {
    if (!this.clipboard.value) {
      return
    }
    const clipboardCells = this.clipboard.value.cells
    const fromPosition = this.clipboard.value.range.start
    const movement = getMovement(fromPosition, toPosition)

    this.getPastePositions(this.clipboard.value.range).forEach((toPosition) => {
      matrixForEach(clipboardCells, (cellJson, [row, col]) => {
        const cellLocator = CellLocator.fromCoords({ row: toPosition.row + row, col: toPosition.col + col })
        const cell = this.grid.getCell(cellLocator)
        let input = cellJson.input
        if (input.startsWith('=')) {
          input = `=${transformGridReference(cellJson.input.slice(1), { type: 'move', movement })}`
        }
        cell.setJson({ ...cellJson, input })
      })
    })
  }
}
