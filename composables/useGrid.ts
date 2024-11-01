import { createSharedComposable } from '@vueuse/core'
import { customRef, shallowReadonly } from 'vue'
import { Grid } from '~/lib/Grid'

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

  return {
    grid,
  }
})

const { grid } = useGrid()

registerCommand({
  name: 'MoveActiveCell!',
  execute: (dir: Direction) => {
    grid.value.moveActiveCell(dir)
  },
  description: 'Move the active cell in a direction',
})
registerCommand({
  name: 'MoveActiveCellTo!',
  execute: (cellId: string) => {
    grid.value.moveActiveCellTo(cellId)
  },
  description: 'Move the active cell to a specific cell',
})
registerCommand({
  name: 'GetSelection',
  execute: () => grid.value.selection.value.getJson(),
  description: 'Get selection range',
})
registerCommand({
  name: 'SetSelection!',
  execute: (range: string) => {
    grid.value.selectRange(range)
  },
  description: 'Set selection to a range',
})
registerCommand({
  name: 'ResetSelection!',
  execute: () => {
    grid.value.resetSelection()
  },
  description: 'Reset selection',
})
registerCommand({
  name: 'ExpandSelection!',
  execute: (dir: Direction) => {
    grid.value.expandSelection(dir)
  },
  description: 'Expand the selection in a direction',
})
registerCommand({
  name: 'SetCellInput!',
  execute: (id: string, input: string) => {
    const cell = grid.value.getOrCreateCell(id)
    cell.input.value = input
  },
  description: 'Set the input of a cell',
})
registerCommand({
  name: 'ClearCell!',
  execute: (id: string) => {
    grid.value.clearCell(id)
  },
  description: 'Clear a cell',
})
registerCommand({
  name: 'ClearRange!',
  execute: (id: string) => {
    grid.value.clearRange(id)
  },
  description: 'Clear a range of cells',
})
registerCommand({
  name: 'ClearAllCells!',
  execute: () => {
    grid.value.clearAllCells()
  },
  description: 'Clear all cells',
})
registerCommand({
  name: 'GetActiveCell',
  execute: () => {
    return grid.value.getActiveCell()?.getJson() ?? null
  },
  description: 'Get the active cell',
})
registerCommand({
  name: 'GetCell',
  execute: (cellId: string) => {
    return grid.value.getCell(cellId)?.getJson() ?? null
  },
  description: 'Get a cell by id',
})
registerCommand({
  name: 'CreateCellAlias!',
  execute: (alias: string, id: string) => {
    grid.value.createCellAlias(alias, id)
  },
  description: 'Create an alias for a cell',
})
registerCommand({
  name: 'RenameCellAlias!',
  execute: (alias: string, newAlias: string) => {
    grid.value.renameCellAlias(alias, newAlias)
  },
  description: 'Rename an alias for a cell',
})
