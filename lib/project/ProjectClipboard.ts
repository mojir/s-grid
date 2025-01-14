import { CellReference } from '../reference/CellReference'
import type { Project } from './Project'
import type { RangeReference } from '~/lib/reference/RangeReference'
import { matrixForEach, matrixMap } from '~/lib/matrix'
import { transformLitsPrograms } from '~/lib/transformer/litsTransformer'
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
      matrixForEach(styleClipboardValue.cells, (cellDTO, [rowIndex, colIndex]) => {
        const reference = CellReference.fromCoords(
          toPosition.grid,
          {
            rowIndex: toPosition.rowIndex + rowIndex,
            colIndex: toPosition.colIndex + colIndex,
          },
        )
        const cell = reference.getCell()
        cell.setDTO(cellDTO)
      })
    })
  }

  private getPastePositions(sourceRange: RangeReference, targetRange: RangeReference): CellReference[] {
    const grid = targetRange.start.grid

    const selectionWidth = targetRange.end.colIndex - targetRange.start.colIndex + 1
    const selectionHeight = targetRange.end.rowIndex - targetRange.start.rowIndex + 1

    const rangeWidth = sourceRange.end.colIndex - sourceRange.start.colIndex + 1
    const rangeHeight = sourceRange.end.rowIndex - sourceRange.start.rowIndex + 1

    const result: CellReference[] = []
    const startRowIndex = targetRange.start.rowIndex
    const startColIndex = targetRange.start.colIndex
    let rowIndex = startRowIndex
    let colIndex = startColIndex
    // Populate result array with the positions (CellReference) to paste the clipboard
    do {
      do {
        result.push(CellReference.fromCoords(grid, { rowIndex: rowIndex, colIndex }))
        colIndex += rangeWidth
      } while (colIndex - startColIndex + rangeWidth <= selectionWidth)
      rowIndex += rangeHeight
      colIndex = startColIndex
    } while (rowIndex - startRowIndex + rangeHeight <= selectionHeight)

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
    matrixForEach(clipboardCells, (cellDTO, [rowIndex, colIndex]) => {
      const reference = CellReference.fromCoords(
        toPosition.grid,
        {
          rowIndex: toPosition.rowIndex + rowIndex,
          colIndex: toPosition.colIndex + colIndex,
        },
      )
      const cell = reference.getCell()
      cell.setDTO(cellDTO)
    })
    const fromRange = this.clipboard.value.range
    const fromPosition = fromRange.start

    this.project.transformAllReferences({
      type: 'move',
      grid: fromPosition.grid,
      range: fromRange,
      toGrid: toPosition.grid,
      toRowIndex: toPosition.rowIndex,
      toColIndex: toPosition.colIndex,
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

      matrixForEach(clipboardCells, (cellDTO, [rowIndex, colIndex]) => {
        const toRowIndex = toPosition.rowIndex + rowIndex
        const toColIndex = toPosition.colIndex + colIndex
        const cell = fromGrid.getCell({ rowIndex: toRowIndex, colIndex: toColIndex })
        if (!cell) {
          throw new Error(`Cell not found at rowIndex=${toRowIndex}, colIndex=${toColIndex}`)
        }
        cell.setDTO(cellDTO)
        transformLitsPrograms({
          cell,
          transformation: {
            type: 'move',
            grid: fromPosition.grid,
            toGrid: toPosition.grid,
            toRowIndex: toPosition.rowIndex,
            toColIndex: toPosition.colIndex,
          },
        })
      })
    })
  }
}
