import { createSharedComposable } from '@vueuse/core'
import { customRef, shallowReadonly } from 'vue'
import { styleFontSizes, type CellStyle, type CellStyleName, type StyleFontSize } from '~/lib/CellStyle'
import { Color } from '~/lib/color'
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
  name: 'SetInput!',
  execute: (input: string, id?: string) => {
    const cell = id ? grid.value.getCell(id) : grid.value.getCurrentCell()
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
  name: 'SetAlias!',
  execute: (alias: string, id?: string) => {
    grid.value.setAlias(alias, id)
  },
  description: 'Create an alias for a cell',
})

registerCommand({
  name: 'SetStyle!',
  execute: <T extends CellStyleName>(property: T, value: CellStyle[T], cellId?: string) => {
    if (validCellStyle(property, value)) {
      grid.value.setStyle(property, value, cellId)
    }
    else {
      throw new Error(`Invalid cell style property: ${property}`)
    }
  },
  description: 'Set the style of a cell',
})

registerCommand({
  name: 'SetBackgroundColor!',
  execute: (hexCode: string, cellId?: string) => {
    const color = Color.fromHex(hexCode)
    grid.value.setBackgroundColor(color, cellId)
  },
  description: 'Set the background color of a cell',
})

registerCommand({
  name: 'SetTextColor!',
  execute: (hexCode: string, cellId?: string) => {
    const color = Color.fromHex(hexCode)
    grid.value.setTextColor(color, cellId)
  },
  description: 'Set the text color of a cell',
})

registerCommand({
  name: 'SetFormatter!',
  execute: (formatter: string, cellId?: string) => {
    if (typeof formatter === 'string') {
      grid.value.setFormatter(formatter, cellId)
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
