import { createSharedComposable } from '@vueuse/core'
import { customRef, shallowReadonly } from 'vue'
import type { CellStyle } from '~/lib/CellStyle'
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
    return grid.value.getActiveCell()?.getJson() ?? 'No active cell'
  },
  description: 'Get the active cell',
})
registerCommand({
  name: 'GetCell',
  execute: (cellId: string) => {
    return grid.value.getCell(cellId)?.getJson() ?? 'Empty cell'
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
registerCommand({
  name: 'SetCellStyle!',
  execute: <T extends keyof CellStyle>(cellId: string, property: T, value: CellStyle[T]) => {
    if (validCellStyle(property, value)) {
      grid.value.setCellStyle(cellId, property, value)
    }
    else {
      throw new Error(`Invalid cell style property: ${property}`)
    }
  },
  description: 'Set the style of a cell',
})

registerCommand({
  name: 'SetCellFormatter!',
  execute: (cellId: string, formatter: string) => {
    if (typeof formatter === 'string') {
      grid.value.setCellFormatter(cellId, formatter)
    }
    else {
      throw new Error(`Invalid formatter: ${formatter}`)
    }
  },
  description: 'Set the formatter of a cell',
})

registerCommand({
  name: 'GetCells',
  execute: () => {
    return grid.value.getCells()
  },
  description: 'Get all cells',
})

function validCellStyle(property: keyof CellStyle, value: unknown): boolean {
  switch (property) {
    case 'bold':
      return typeof value === 'boolean'
    case 'italic':
      return typeof value === 'boolean'
  }
  return false
}
