import { createSharedComposable } from '@vueuse/core'
import { customRef, shallowReadonly } from 'vue'
import { styleFontSizes, type CellStyle, type CellStyleName, type StyleFontSize } from '~/lib/CellStyle'
import { Grid } from '~/lib/Grid'

const defaultNbrOfRows = 50
const defaultNbrOfCols = 26

const { registerCommand } = useCommandCenter()

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

const colorModeRef: Ref<Ref<string> | null> = ref(null)

export function setColorMode(colorMode: Ref<string>) {
  colorModeRef.value = colorMode
}

export const useGrid = createSharedComposable(() => {
  const grid = shallowReadonly(customRef((track, trigger) => {
    const gridInstance = new Grid(colorModeRef, defaultNbrOfRows, defaultNbrOfCols, trigger)
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
  name: 'MovePosition!',
  execute: (dir: Direction) => {
    grid.value.movePosition(dir)
  },
  description: 'Move the position in a direction',
})
registerCommand({
  name: 'MovePositionTo!',
  execute: (cellId: string) => {
    grid.value.movePositionTo(cellId)
  },
  description: 'Move the position to a specific cell',
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
    grid.value.getCell(id).input.value = input
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
  name: 'GetCurrentCell',
  execute: () => {
    return grid.value.getCurrentCell().getJson()
  },
  description: 'Get the current cell',
})
registerCommand({
  name: 'GetCell',
  execute: (cellId: string) => {
    return grid.value.getCell(cellId).getJson()
  },
  description: 'Get a cell by id',
})
registerCommand({
  name: 'SetCellAlias!',
  execute: (id: string, alias: string) => {
    grid.value.setCellAlias(id, alias)
  },
  description: 'Create an alias for a cell',
})
registerCommand({
  name: 'SetCellStyle!',
  execute: <T extends CellStyleName>(cellId: string, property: T, value: CellStyle[T]) => {
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

function validCellStyle(property: CellStyleName, value: unknown): boolean {
  switch (property) {
    case 'bold':
      return typeof value === 'boolean'
    case 'italic':
      return typeof value === 'boolean'
    case 'textDecoration':
      return ['underline', 'line-through'].includes(value as string)
    case 'justify':
      return ['left', 'center', 'right'].includes(value as string)
    case 'align':
      return ['top', 'middle', 'bottom'].includes(value as string)
    case 'fontSize':
      return styleFontSizes.includes(value as StyleFontSize)
  }
}
