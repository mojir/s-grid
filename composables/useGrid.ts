import { createSharedComposable } from '@vueuse/core'
import { customRef, shallowReadonly } from 'vue'
import { styleFontSizes, type CellStyle, type CellStyleName, type StyleFontSize } from '~/lib/CellStyle'
import { Color } from '~/lib/color'
import { Grid } from '~/lib/Grid'

const { registerCommand } = useCommandCenter()

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

const colorModeRef: Ref<Ref<string> | null> = ref(null)

export function setColorMode(colorMode: Ref<string>) {
  colorModeRef.value = colorMode
}

export const useGrid = createSharedComposable(() => {
  const { rows, cols } = useRowsAndCols()
  const grid = shallowReadonly(customRef((track) => {
    const gridInstance = new Grid(colorModeRef, rows, cols)
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
  name: 'Move!',
  execute: (direction: Direction) => {
    grid.value.movePosition(direction)
  },
  description: 'Move the position one step in a specific direction.',
})
registerCommand({
  name: 'MoveTo!',
  execute: (cell: string) => {
    grid.value.movePositionTo(cell)
  },
  description: 'Move the position to a specific cell',
})
registerCommand({
  name: 'SetInput!',
  execute: (input: string, target?: string) => {
    grid.value.setInput(input, target)
  },
  description: 'Set the input of a cell or a range of cells. If no target is specified, set input of all cells in the current selection.',
})
registerCommand({
  name: 'Clear!',
  execute: (target?: string) => {
    grid.value.clear(target)
  },
  description: 'Clear a cell or a range of cells. If no target is specified, clear the current selection.',
})
registerCommand({
  name: 'ClearAllCells!',
  execute: () => {
    grid.value.clearAllCells()
  },
  description: 'Clear all cells',
})
registerCommand({
  name: 'GetCell',
  execute: (cellId: string) => {
    return grid.value.getCell(cellId).getDebugInfo()
  },
  description: 'Get a cell. If no target is specified, get the active cell.',
})
registerCommand({
  name: 'GetCells',
  execute: (cellId: string) => {
    return grid.value.getCells(cellId).map(cell => cell.getDebugInfo())
  },
  description: 'Get array of cells. If no target is specified, get all cells in the current selection.',
})
registerCommand({
  name: 'SetAlias!',
  execute: (alias: string, id?: string) => {
    const cell = grid.value.getCell(id)
    useAlias().setAlias(alias, cell)
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
  description: 'Set the style of a cell or a range of cells. If no target is specified, set the style of all cells in the current selection.',
})

registerCommand({
  name: 'SetBackgroundColor!',
  execute: (hexCode: string, target?: string) => {
    const color = Color.fromHex(hexCode)
    grid.value.setBackgroundColor(color, target)
  },
  description: 'Set the background color of a cell or a range of cells. If no target is specified, set the background color of all cells in the current selection.',
})

registerCommand({
  name: 'SetTextColor!',
  execute: (hexCode: string, target?: string) => {
    const color = Color.fromHex(hexCode)
    grid.value.setTextColor(color, target)
  },
  description: 'Set the text color of a cell or a range of cells. If no target is specified, set the text color of all cells in the current selection.',
})

registerCommand({
  name: 'SetFormatter!',
  execute: (formatter: string, target?: string) => {
    grid.value.setFormatter(formatter, target)
  },
  description: 'Set the formatter program of a cell or a range of cells. If no target is specified, set the formatter program of all cells in the current selection.',
})

registerCommand({
  name: 'ResetSelection!',
  execute: () => {
    grid.value.resetSelection()
  },
  description: 'Reset the selection',
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
