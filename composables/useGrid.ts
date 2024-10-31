import { createSharedComposable } from '@vueuse/core'
import { customRef, shallowReadonly } from 'vue'
import { CellId } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import type { Col } from '~/lib/Col'
import { Grid } from '~/lib/Grid'
import type { Row } from '~/lib/Row'

const defaultNbrOfRows = 50
const defaultNbrOfCols = 26

const { registerCommand } = useCommandCenter()

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

export const useGrid = createSharedComposable(() => {
  const grid = shallowReadonly(customRef((track, trigger) => {
    const gridInstance = new Grid(defaultNbrOfRows, defaultNbrOfCols, trigger)
    return {
      get() {
        track()
        return gridInstance
      },
      set() { },
    }
  }))

  function moveActiveCell(dir: Direction, wrap = false) {
    const range = grid.value.selection.value.size() > 1 ? grid.value.selection.value : grid.value.range

    switch (dir) {
      case 'up':
        moveActiveCellTo(grid.value.activeCellId.value.cellUp(range, wrap))
        break
      case 'down':
        moveActiveCellTo(grid.value.activeCellId.value.cellDown(range, wrap))
        break
      case 'left':
        moveActiveCellTo(grid.value.activeCellId.value.cellLeft(range, wrap))
        break
      case 'right':
        moveActiveCellTo(grid.value.activeCellId.value.cellRight(range, wrap))
        break
      case 'top':
        moveActiveCellTo(grid.value.activeCellId.value.cellTop(range))
        break
      case 'bottom':
        moveActiveCellTo(grid.value.activeCellId.value.cellBottom(range))
        break
      case 'leftmost':
        moveActiveCellTo(grid.value.activeCellId.value.cellLeftmost(range))
        break
      case 'rightmost':
        moveActiveCellTo(grid.value.activeCellId.value.cellRightmost(range))
        break
    }
  }

  function expandSelection(dir: Direction) {
    const start = grid.value.unsortedSelection.value.start
    const end = grid.value.unsortedSelection.value.end.cellMove(dir, grid.value.range, false)

    grid.value.unsortedSelection.value = CellRange.fromCellIds(start, end)
  }

  function moveActiveCellTo(id: string | CellId) {
    const cellId = grid.value.getCellId(id)

    const range = grid.value.selection.value.size() > 1
      ? grid.value.selection.value
      : grid.value.range

    grid.value.activeCellId.value = cellId.clamp(range)
    grid.value.unsortedSelection.value = CellRange.fromSingleCellId(grid.value.activeCellId.value)
  }

  function selectRange(id: string | CellRange) {
    const range = CellRange.isCellRange(id)
      ? id
      : CellRange.isCellRangeString(id)
        ? CellRange.fromId(id).clamp(grid.value.range)
        : null

    if (!range) {
      console.error(`Invalid range: ${id}`)
      return
    }

    grid.value.unsortedSelection.value = range
  }

  function selectCell(id: string | CellId) {
    const cellId = CellId.isCellId(id)
      ? id
      : CellId.isCellIdString(id)
        ? CellId.fromId(id).clamp(grid.value.range)
        : null

    if (!cellId) {
      console.error(`Invalid cell id: ${id}`)
      return
    }

    grid.value.unsortedSelection.value = CellRange.fromSingleCellId(cellId)
  }

  function selectAll() {
    grid.value.unsortedSelection.value = grid.value.range
  }

  function selectColRange(fromCol: Col, toCol: Col) {
    grid.value.unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(0, fromCol.index),
        CellId.fromCoords(grid.value.range.end.rowIndex, toCol.index))
  }

  function selectRowRange(fromRow: Row, toRow: Row) {
    grid.value.unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(fromRow.index, 0),
        CellId.fromCoords(toRow.index, grid.value.range.end.colIndex))
  }

  function resetSelection() {
    grid.value.unsortedSelection.value = CellRange.fromSingleCellId(grid.value.activeCellId.value)
  }

  function isInsideSelection(id: string | CellId): boolean {
    const cellId = grid.value.getCellId(id)
    return grid.value.unsortedSelection.value.contains(cellId)
  }

  registerCommand({
    name: 'MoveActiveCell!',
    execute: (dir: Direction) => {
      moveActiveCell(dir)
    },
    description: 'Move the active cell in a direction by a number of steps, default steps is 1',
  })
  registerCommand({
    name: 'MoveActiveCellTo!',
    execute: (id: string) => {
      moveActiveCellTo(id)
    },
    description: 'Move the active cell to a specific cell',
  })
  registerCommand({
    name: 'GetSelection',
    execute: () => grid.value.unsortedSelection.value,
    description: 'Set the selection',
  })
  registerCommand({
    name: 'SetSelection!',
    execute: (selection: string) => {
      selectRange(selection)
    },
    description: 'Set the selection',
  })
  registerCommand({
    name: 'ResetSelection!',
    execute: () => {
      resetSelection()
    },
    description: 'Set the selection',
  })
  registerCommand({
    name: 'ExpandSelection!',
    execute: (dir: Direction) => {
      expandSelection(dir)
    },
    description: 'Set the selection',
  })

  return {
    activeCellId: shallowReadonly(grid.value.activeCellId),
    selection: shallowReadonly(grid.value.selection),
    grid,
    moveActiveCell,
    moveActiveCellTo,
    selectCell,
    selectRange,
    selectAll,
    resetSelection,
    selectRowRange,
    selectColRange,
    isInsideSelection,
    expandSelection,
  }
})
