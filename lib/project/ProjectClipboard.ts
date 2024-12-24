import { CellLocator } from '../locators/CellLocator'
import type { Movement } from '../locators/utils'
import type { Project } from './Project'
import type { RangeLocator } from '~/lib/locators/RangeLocator'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformLocators } from '~/lib/transformLocators'
import type { CellDTO } from '~/dto/CellDTO'

type InternalClipboard<T> = {
  range: RangeLocator
  cells: T[][]
}

export class ProjectClipboard {
  private readonly clipboard = shallowRef<InternalClipboard<CellDTO> | null>(null)
  private readonly styleClipboard = shallowRef<InternalClipboard<CellDTO> | null>(null)
  private readonly cutCellIds = shallowRef<CellLocator[] | null>(null)
  public hasStyleData = computed(() => !!this.styleClipboard.value)

  constructor(private project: Project) {
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
      cells: matrixMap(range.getCellIdMatrix(), cellLocator => cellLocator.getCell().getDTO()),
    }
  }

  public copyStyleSelection(range: RangeLocator) {
    this.styleClipboard.value = {
      range,
      cells: matrixMap(range.getCellIdMatrix(), (cellLocator) => {
        const cellDTO = cellLocator.getCell().getDTO()
        return {
          fontSize: cellDTO.fontSize,
          bold: cellDTO.bold,
          italic: cellDTO.italic,
          textDecoration: cellDTO.textDecoration,
          justify: cellDTO.justify,
          align: cellDTO.align,
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
        const cellLocator = CellLocator.fromCoords(toPosition.grid, { row: toPosition.row + row, col: toPosition.col + col })
        const cell = cellLocator.getCell()
        cell.setDTO(cellDTO)
      })
    })
  }

  private getPastePositions(sourceRange: RangeLocator, targetRange: RangeLocator): CellLocator[] {
    const grid = targetRange.start.grid

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
        result.push(CellLocator.fromCoords(grid, { row, col }))
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
      cellLocator.grid.clear(cellLocator)
    })

    const toPosition = targetRange.start

    const clipboardCells = this.clipboard.value.cells
    matrixForEach(clipboardCells, (cellDTO, [row, col]) => {
      const cellLocator = CellLocator.fromCoords(toPosition.grid, { row: toPosition.row + row, col: toPosition.col + col })
      const cell = cellLocator.getCell()
      cell.setDTO(cellDTO)
    })
    const fromRange = this.clipboard.value.range
    const fromPosition = fromRange.start
    const movement: Movement = {
      toGrid: toPosition.grid,
      deltaRow: toPosition.row - fromPosition.row,
      deltaCol: toPosition.col - fromPosition.col,
    }

    this.project.transformAllLocators({
      sourceGrid: fromRange.start.grid,
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
    const fromGrid = targetRange.grid
    this.getPastePositions(this.clipboard.value.range, targetRange).forEach((toPosition) => {
      if (!this.clipboard.value) {
        return
      }
      const clipboardCells = this.clipboard.value.cells
      const range = this.clipboard.value.range
      const fromPosition = range.start
      const movement: Movement = {
        toGrid: toPosition.grid,
        deltaRow: toPosition.row - fromPosition.row,
        deltaCol: toPosition.col - fromPosition.col,
      }

      matrixForEach(clipboardCells, (cellDTO, [row, col]) => {
        const cell = fromGrid.cells[toPosition.row + row][toPosition.col + col]
        cell.setDTO(cellDTO)
        transformLocators(
          cell,
          {
            sourceGrid: fromPosition.grid,
            type: 'move',
            movement,
          },
        )
      })
    })
  }
}
