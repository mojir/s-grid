import { CellLocator } from './locator/CellLocator'
import type { Movement } from './locator/utils'
import type { GridProject } from './GridProject'
import type { RangeLocator } from '~/lib/locator/RangeLocator'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformLocators } from '~/lib/transformFormula'
import type { CellDTO } from '~/dto/CellDTO'

type InternalClipboard<T> = {
  range: RangeLocator
  cells: T[][]
}

export class ProjectClipboard {
  private clipboard = ref<InternalClipboard<CellDTO> | null>(null)
  private styleClipboard = ref<InternalClipboard<CellDTO> | null>(null)
  private cutCellIds = ref<CellLocator[] | null>(null)
  public hasStyleData = computed(() => !!this.styleClipboard.value)

  constructor(private gridProject: GridProject) {
  }

  public clearStyleClipboard() {
    this.styleClipboard.value = null
  }

  public copyRange(range: RangeLocator) {
    if (this.cutCellIds.value !== null) {
      this.cutCellIds.value = null
    }

    this.clipboard.value = {
      range,
      cells: matrixMap(range.getCellIdMatrix(), cellLocator => this.gridProject.getCellFromLocator(cellLocator).getDTO()),
    }
  }

  public copyStyleSelection(range: RangeLocator) {
    this.styleClipboard.value = {
      range,
      cells: matrixMap(range.getCellIdMatrix(), (cellLocator) => {
        const cellDTO = this.gridProject.getCellFromLocator(cellLocator).getDTO()
        return {
          style: cellDTO.style,
          backgroundColor: cellDTO.backgroundColor,
          textColor: cellDTO.textColor,
          formatter: cellDTO.formatter,
        }
      }),
    }
  }

  public cutSelection(range: RangeLocator) {
    this.copyRange(range)
    this.cutCellIds.value = range.getAllCellLocators()
  }

  public pasteSelection(targetRange: RangeLocator) {
    if (this.cutCellIds.value) {
      this.cutPasteSelection(targetRange)
    }
    else {
      this.copyPasteSelection(targetRange)
    }
  }

  public pasteStyleSelection(targetRange: RangeLocator) {
    const styleClipboardValue = this.styleClipboard.value
    if (!styleClipboardValue) {
      return
    }
    this.styleClipboard.value = null
    this.getPastePositions(styleClipboardValue.range, targetRange).forEach((toPosition) => {
      matrixForEach(styleClipboardValue.cells, (cellDTO, [row, col]) => {
        const cellLocator = CellLocator.fromCoords(toPosition.gridName, { row: toPosition.row + row, col: toPosition.col + col })
        const cell = this.gridProject.getCellFromLocator(cellLocator)
        const { alias, ...cellDTOWithoutAlias } = cellDTO
        cell.setDTO(cellDTOWithoutAlias)
      })
    })
  }

  private getPastePositions(sourceRange: RangeLocator, targetRange: RangeLocator): CellLocator[] {
    const gridName = targetRange.start.gridName

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
        result.push(CellLocator.fromCoords(gridName, { row, col }))
        col += rangeWidth
      } while (col - startCol + rangeWidth <= selectionWidth)
      row += rangeHeight
      col = startCol
    } while (row - startRow + rangeHeight <= selectionHeight)

    return result
  }

  private cutPasteSelection(targetRange: RangeLocator) {
    if (!this.cutCellIds.value || !this.clipboard.value) {
      return
    }

    this.cutCellIds.value.forEach((cellLocator) => {
      this.gridProject.getGridFromLocator(cellLocator).clear(cellLocator)
    })

    const toPosition = targetRange.start

    const clipboardCells = this.clipboard.value.cells
    matrixForEach(clipboardCells, (cellDTO, [row, col]) => {
      const cellLocator = CellLocator.fromCoords(toPosition.gridName, { row: toPosition.row + row, col: toPosition.col + col })
      const cell = this.gridProject.getCellFromLocator(cellLocator)
      cell.setDTO(cellDTO)
    })
    const fromRange = this.clipboard.value.range
    const fromPosition = fromRange.start
    const movement: Movement = {
      toGrid: toPosition.gridName,
      deltaRow: toPosition.row - fromPosition.row,
      deltaCol: toPosition.col - fromPosition.col,
    }

    this.gridProject.transformAllLocators({
      sourceGrid: this.gridProject.getGrid(fromRange.start.gridName),
      type: 'move',
      movement,
      range: fromRange,
    })

    this.clipboard.value = null
    this.cutCellIds.value = null
  }

  private copyPasteSelection(targetRange: RangeLocator) {
    if (!this.clipboard.value) {
      return
    }
    const fromGrid = this.gridProject.getGridFromLocator(targetRange)
    this.getPastePositions(this.clipboard.value.range, targetRange).forEach((toPosition) => {
      if (!this.clipboard.value) {
        return
      }
      const clipboardCells = this.clipboard.value.cells
      const range = this.clipboard.value.range
      const fromPosition = range.start
      const movement: Movement = {
        toGrid: toPosition.gridName,
        deltaRow: toPosition.row - fromPosition.row,
        deltaCol: toPosition.col - fromPosition.col,
      }

      matrixForEach(clipboardCells, (cellDTO, [row, col]) => {
        const cell = fromGrid.cells[toPosition.row + row][toPosition.col + col]
        cell.setDTO(cellDTO)
        transformLocators(
          cell,
          {
            sourceGrid: this.gridProject.getGrid(fromPosition.gridName),
            type: 'move',
            movement,
          },
        )
      })
    })
  }
}
