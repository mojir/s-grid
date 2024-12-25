import { CellReference } from '../reference/CellReference'
import type { Movement } from '../reference/utils'
import type { Project } from './Project'
import type { RangeReference } from '~/lib/reference/RangeReference'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformReferences } from '~/lib/referenceTransformer'
import type { CellDTO } from '~/dto/CellDTO'

type InternalClipboard<T> = {
  range: RangeReference
  cells: T[][]
}

export class ProjectClipboard {
  private readonly clipboard = shallowRef<InternalClipboard<CellDTO> | null>(null)
  private readonly styleClipboard = shallowRef<InternalClipboard<CellDTO> | null>(null)
  private readonly cutCellIds = shallowRef<CellReference[] | null>(null)
  public hasStyleData = computed(() => !!this.styleClipboard.value)

  constructor(private project: Project) {
  }

  public clearStyleClipboard() {
    this.styleClipboard.value = null
  }

  public copyRange(range: RangeReference) {
    if (this.cutCellIds.value !== null) {
      this.cutCellIds.value = null
    }

    this.clipboard.value = {
      range,
      cells: matrixMap(range.getCellIdMatrix(), reference => reference.getCell().getDTO()),
    }
  }

  public copyStyleSelection(range: RangeReference) {
    this.styleClipboard.value = {
      range,
      cells: matrixMap(range.getCellIdMatrix(), (reference) => {
        const cellDTO = reference.getCell().getDTO()
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

  public cutSelection(range: RangeReference) {
    this.copyRange(range)
    this.cutCellIds.value = range.getAllCellReferences()
  }

  public pasteSelection(targetRange: RangeReference) {
    if (this.cutCellIds.value) {
      this.cutPasteSelection(targetRange)
    }
    else {
      this.copyPasteSelection(targetRange)
    }
  }

  public pasteStyleSelection(targetRange: RangeReference) {
    const styleClipboardValue = this.styleClipboard.value
    if (!styleClipboardValue) {
      return
    }
    this.styleClipboard.value = null
    this.getPastePositions(styleClipboardValue.range, targetRange).forEach((toPosition) => {
      matrixForEach(styleClipboardValue.cells, (cellDTO, [row, col]) => {
        const reference = CellReference.fromCoords(toPosition.grid, { row: toPosition.row + row, col: toPosition.col + col })
        const cell = reference.getCell()
        cell.setDTO(cellDTO)
      })
    })
  }

  private getPastePositions(sourceRange: RangeReference, targetRange: RangeReference): CellReference[] {
    const grid = targetRange.start.grid

    const selectionWidth = targetRange.end.col - targetRange.start.col + 1
    const selectionHeight = targetRange.end.row - targetRange.start.row + 1

    const rangeWidth = sourceRange.end.col - sourceRange.start.col + 1
    const rangeHeight = sourceRange.end.row - sourceRange.start.row + 1

    const result: CellReference[] = []
    const startRow = targetRange.start.row
    const startCol = targetRange.start.col
    let row = startRow
    let col = startCol
    // Populate result array with the positions (CellReference) to paste the clipboard
    do {
      do {
        result.push(CellReference.fromCoords(grid, { row, col }))
        col += rangeWidth
      } while (col - startCol + rangeWidth <= selectionWidth)
      row += rangeHeight
      col = startCol
    } while (row - startRow + rangeHeight <= selectionHeight)

    return result
  }

  private cutPasteSelection(targetRange: RangeReference) {
    if (!this.cutCellIds.value || !this.clipboard.value) {
      return
    }

    this.cutCellIds.value.forEach((reference) => {
      reference.grid.clear(reference)
    })

    const toPosition = targetRange.start

    const clipboardCells = this.clipboard.value.cells
    matrixForEach(clipboardCells, (cellDTO, [row, col]) => {
      const reference = CellReference.fromCoords(toPosition.grid, { row: toPosition.row + row, col: toPosition.col + col })
      const cell = reference.getCell()
      cell.setDTO(cellDTO)
    })
    const fromRange = this.clipboard.value.range
    const fromPosition = fromRange.start
    const movement: Movement = {
      toGrid: toPosition.grid,
      deltaRow: toPosition.row - fromPosition.row,
      deltaCol: toPosition.col - fromPosition.col,
    }

    this.project.transformAllReferences({
      sourceGrid: fromRange.start.grid,
      type: 'move',
      movement,
      range: fromRange,
    })

    this.clipboard.value = null
    this.cutCellIds.value = null
  }

  private copyPasteSelection(targetRange: RangeReference) {
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
        transformReferences(
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
