import type { Project } from '~/lib/project/Project'
import { CellReference } from '~/lib/reference/CellReference'
import { RangeReference } from '~/lib/reference/RangeReference'
import { getAutoFillRangeInfo, type Reference } from '~/lib/reference/utils'

type AutoFillType = 'activeCell' | 'selection'
type AutoFillHandle = Extract<Handle, 'se' | 'move'>

type MoveHandle = {
  reference: Reference
  autoFillHandle: AutoFillHandle
  autoFillType: AutoFillType
}

function isEventTargetType(value: unknown): value is AutoFillType {
  return typeof value === 'string' && (value === 'activeCell' || value === 'selection')
}

function isAutoFillHandle(value: unknown): value is AutoFillHandle {
  return typeof value === 'string' && (value === 'se' || value === 'move')
}

export class AutoFiller {
  private moveHandle: null | MoveHandle = null

  constructor(private project: Project) {}
  public handleMouseDown(event: MouseEvent) {
    const targetInfo = this.getInfoFromEvent(event)
    if (!targetInfo) {
      return
    }

    const { autoFillType, autoFillHandle } = targetInfo

    const grid = this.project.currentGrid.value
    this.moveHandle = {
      autoFillHandle,
      autoFillType,
      reference: grid.position.value,
    }
  }

  public handleMouseMove(event: MouseEvent) {
    if (!this.moveHandle) {
      return
    }
    const id = getIdFromTarget(event.target, 'cell')
    if (!id) {
      return
    }
    const cellReferenceString = id.split('|')[2]
    if (!cellReferenceString) {
      return
    }

    const grid = this.project.currentGrid.value

    const { autoFillHandle, autoFillType } = this.moveHandle
    switch (autoFillHandle) {
      case 'se': {
        grid.state.value = autoFillType === 'activeCell' ? 'cellAutoFilling' : 'rangeAutoFilling'
        break
      }
      case 'move': {
        grid.state.value = autoFillType === 'activeCell' ? 'cellMoving' : 'rangeMoving'
        break
      }
    }
  }

  public handleMouseUp() {
    if (!this.moveHandle) {
      return
    }

    const grid = this.project.currentGrid.value
    const hoveredCell = grid.hoveredCell.value
    const state = grid.state.value
    const clipBoard = this.project.clipboard

    if (hoveredCell && ['cellMoving', 'rangeMoving', 'cellAutoFilling', 'rangeAutoFilling'].includes(state)) {
      clipBoard.storeState()
      const range = state === 'cellMoving' ? RangeReference.fromCellReference(grid.position.value) : grid.selection.selectedRange.value

      if (state === 'cellMoving' || state === 'rangeMoving') {
        clipBoard.cut(range)
        clipBoard.paste(RangeReference.fromCellReference(hoveredCell))
        grid.selection.updateSelection(hoveredCell, CellReference.fromCoords(grid, {
          rowIndex: hoveredCell.rowIndex + range.rowCount() - 1,
          colIndex: hoveredCell.colIndex + range.colCount() - 1,
        }))
        grid.position.value = hoveredCell
      }
      else {
        const autoFillRange = getAutoFillRangeInfo(range, hoveredCell)?.autoFillRange
        if (autoFillRange) {
          clipBoard.copy(range)
          clipBoard.paste(autoFillRange)

          let startRowIndex: number
          let endRowIndex: number
          let startColIndex: number
          let endColIndex: number

          if (range.start.rowIndex <= autoFillRange.start.rowIndex) {
            startRowIndex = range.start.rowIndex
            endRowIndex = autoFillRange.end.rowIndex
          }
          else {
            startRowIndex = range.end.rowIndex
            endRowIndex = autoFillRange.start.rowIndex
          }

          if (range.start.colIndex <= autoFillRange.start.colIndex) {
            startColIndex = range.start.colIndex
            endColIndex = autoFillRange.end.colIndex
          }
          else {
            startColIndex = range.end.colIndex
            endColIndex = autoFillRange.start.colIndex
          }

          grid.selection.updateSelection(
            CellReference.fromCoords(grid, { rowIndex: startRowIndex, colIndex: startColIndex }),
            CellReference.fromCoords(grid, { rowIndex: endRowIndex, colIndex: endColIndex }),
          )
        }
      }
      clipBoard.restoreState()
    }

    grid.hoveredCell.value = null
    grid.state.value = 'idle'
    this.moveHandle = null
  }

  private getInfoFromEvent(event: MouseEvent): Pick<MoveHandle, 'autoFillHandle' | 'autoFillType'> | null {
    const id = getIdFromTarget(event.target, 'activeCell') ?? getIdFromTarget(event.target, 'selection')
    if (!id) {
      return null
    }

    const [autoFillType, option] = id.split('|')
    if (!option || !isEventTargetType(autoFillType)) {
      return null
    }

    const autoFillHandle = option.split('-')[1]
    if (!isAutoFillHandle(autoFillHandle)) {
      return null
    }

    return {
      autoFillType,
      autoFillHandle,
    }
  }
}
