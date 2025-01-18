import type { Project } from '~/lib/project/Project'
import { CellReference } from '~/lib/reference/CellReference'
import { RangeReference } from '~/lib/reference/RangeReference'
import { getAutoFillRangeInfo } from '~/lib/reference/utils'
import { getIdFromTarget, type Handle } from '~/lib/utils'

type MoveHandle = {
  cellReference: CellReference
  handle: Extract<Handle, 'se' | 'move'>
}

export class ActiveCell {
  private moveHandle: null | MoveHandle = null

  constructor(private project: Project) {}
  public handleMouseDown(event: MouseEvent) {
    const id = getIdFromTarget(event.target, 'activeCell')
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
      cellReference: grid.position.value,
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
        grid.state.value = 'cellAutoFilling'
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

    if (state === 'cellAutoFilling' && secondaryPosition) {
      const autoFillRange = getAutoFillRangeInfo(grid.position.value, secondaryPosition)?.autoFillRange
      if (autoFillRange) {
        clipBoard.storeState()
        clipBoard.copyRange(RangeReference.fromCellReference(grid.position.value))
        clipBoard.pasteSelection(autoFillRange)
        clipBoard.restoreState()
        // Update selection to cover the new range
      }
    }

    grid.secondaryPosition.value = null
    grid.state.value = 'idle'
    this.moveHandle = null
  }
}
