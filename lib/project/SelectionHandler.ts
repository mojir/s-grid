import type { Project } from '~/lib/project/Project'
import { CellReference } from '~/lib/reference/CellReference'
import { RangeReference } from '~/lib/reference/RangeReference'
import { getAutoFillRangeInfo } from '~/lib/reference/utils'
import { getIdFromTarget, type Handle } from '~/lib/utils'

type MoveHandle = {
  rangeReference: RangeReference
  handle: Extract<Handle, 'se' | 'move'>
}

export class SelectionHandler {
  private moveHandle: null | MoveHandle = null

  constructor(private project: Project) {}
  public handleMouseDown(event: MouseEvent) {
    const id = getIdFromTarget(event.target, 'selection')
    if (!id) {
      return
    }
    const [, option] = id.split('|')
    if (!option) {
      return
    }
    const handle = option.split('-')[1]
    if (handle !== 'move' && handle !== 'se') {
      return
    }

    const grid = this.project.currentGrid.value
    this.moveHandle = {
      handle,
      rangeReference: grid.selection.selectedRange.value,
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
    grid.secondaryPosition.value = CellReference.fromString(this.project.currentGrid.value, cellReferenceString)

    const { handle } = this.moveHandle
    switch (handle) {
      case 'se': {
        grid.state.value = 'rangeAutoFilling'
        break
      }
      case 'move': {
        grid.state.value = 'cellMoving'
        break
      }
    }
  }

  public handleMouseUp() {
    if (!this.moveHandle) {
      return
    }

    const grid = this.project.currentGrid.value
    const secondaryPosition = grid.secondaryPosition.value
    const state = grid.state.value
    const clipBoard = this.project.clipboard

    if (state === 'cellMoving' && secondaryPosition && grid.position.value.equals(secondaryPosition)) {
      clipBoard.storeState()
      clipBoard.cutSelection(RangeReference.fromCellReference(grid.position.value))
      clipBoard.pasteSelection(RangeReference.fromCellReference(secondaryPosition))
      clipBoard.restoreState()
    }

    if (state === 'rangeAutoFilling' && secondaryPosition) {
      const autoFillRange = getAutoFillRangeInfo(grid.selection.selectedRange.value, secondaryPosition)?.autoFillRange
      if (autoFillRange) {
        clipBoard.storeState()
        clipBoard.copyRange(grid.selection.selectedRange.value)
        clipBoard.pasteSelection(autoFillRange)
        clipBoard.restoreState()
        // Update selection to cover the new range
        let startRowIndex: number
        let endRowIndex: number
        let startColIndex: number
        let endColIndex: number

        if (grid.selection.selectedRange.value.start.rowIndex <= autoFillRange.start.rowIndex) {
          startRowIndex = grid.selection.selectedRange.value.start.rowIndex
          endRowIndex = autoFillRange.end.rowIndex
        }
        else {
          startRowIndex = grid.selection.selectedRange.value.end.rowIndex
          endRowIndex = autoFillRange.start.rowIndex
        }

        if (grid.selection.selectedRange.value.start.colIndex <= autoFillRange.start.colIndex) {
          startColIndex = grid.selection.selectedRange.value.start.colIndex
          endColIndex = autoFillRange.end.colIndex
        }
        else {
          startColIndex = grid.selection.selectedRange.value.end.colIndex
          endColIndex = autoFillRange.start.colIndex
        }

        grid.selection.updateSelection(
          CellReference.fromCoords(grid, { rowIndex: startRowIndex, colIndex: startColIndex }),
          CellReference.fromCoords(grid, { rowIndex: endRowIndex, colIndex: endColIndex }),
        )
      }
    }

    grid.secondaryPosition.value = null
    grid.state.value = 'idle'
    this.moveHandle = null
  }
}
