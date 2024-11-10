import type { CellId } from '~/lib/CellId'
import { validCellStyle, type CellStyle, type CellStyleName } from '~/lib/CellStyle'
import { Color } from '~/lib/color'
import type { JsFunctions } from '~/lib/litsInterop'
import { format } from '~/lib/litsInterop/format'

const builtinCommandNames = [
  'Clear!',
  'ClearAllCells!',
  'ClearRepl!',
  'CreateNamedFunction!',
  'ExpandSelection!',
  'ExpandSelectionTo!',
  'GetCell',
  'GetCells',
  'GetSelection',
  'Help',
  'Move!',
  'MoveTo!',
  'ResetSelection!',
  'RestartRepl!',
  'Select!',
  'SetAlias!',
  'SetBackgroundColor!',
  'SetColWidth!',
  'SetFormatter!',
  'SetInput!',
  'SetRowHeight!',
  'SetStyle!',
  'SetTextColor!',
] as const

type BuiltinCommandName = typeof builtinCommandNames[number]

type Command<T extends string> = {
  name: T
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => unknown
}

const commands = new Map<string, Command<string>>()
const jsFunctions: JsFunctions = {
  format,
}

function registerCommand(command: Command<BuiltinCommandName>) {
  commands.set(command.name, command)
  jsFunctions[command.name] = { fn: (...args: unknown[]) => exec(command.name, ...args) }
}

function exec(name: BuiltinCommandName, ...args: unknown[]) {
  const command = commands.get(name)
  if (!command) {
    console.error(`Command ${name} not found`)
    return
  }
  return command.execute(...args)
}

export const useCommandCenter = () => {
  registerCommands()

  return {
    jsFunctions,
    exec,
    commands,
  }
}

export type CommandCenterComposable = ReturnType<typeof useCommandCenter>

function registerCommands() {
  const grid = useGrid()
  const selection = useSelection()
  const repl = useREPL()

  registerCommand({
    name: 'CreateNamedFunction!',
    execute: (alias: string, input: string, target?: string) => {
      const cell = grid.value.getCell(target)
      useAlias().setAlias(alias, cell)
      grid.value.setInput(input, target)
    },
    description: 'Clear the current cell',
  })

  registerCommand({
    name: 'SetRowHeight!',
    execute: (height: number, target?: string) => {
      const cell = grid.value.getCell(target)
      useRowsAndCols().getRow(cell.cellId.getRowId()).height.value = height
    },
    description: 'Set row height',
  })

  registerCommand({
    name: 'SetColWidth!',
    execute: (width: number, target?: string) => {
      const cell = grid.value.getCell(target)
      useRowsAndCols().getCol(cell.cellId.getColId()).width.value = width
    },
    description: 'Set column width',
  })

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

  registerCommand({
    name: 'GetSelection',
    execute: () => selection.selection.value.getJson(),
    description: 'Get the current selection.',
  })

  registerCommand({
    name: 'ExpandSelection!',
    execute: (direction: Direction) => {
      selection.expandSelection(direction)
    },
    description: 'Expand the selection one step in a specific direction',
  })

  registerCommand({
    name: 'ExpandSelectionTo!',
    execute: (target: CellId | string) => {
      selection.expandSelectionTo(target)
    },
    description: 'Expand the selection to a cell',
  })

  registerCommand({
    name: 'Select!',
    execute: (target: string) => {
      selection.select(target)
    },
    description: 'Select a cell or a range',
  })

  registerCommand({
    name: 'ClearRepl!',
    description: 'Clear the Repl history',
    execute: () => {
      repl.clearRepl()
    },
  })

  registerCommand({
    name: 'RestartRepl!',
    description: 'Clear the Repl Lits context',
    execute: () => {
      repl.restartRepl()
      return 'Repl context cleared'
    },
  })

  registerCommand({
    name: 'Help',
    description: 'Get the list of available commands',
    execute: (topic?: string): string => {
      return repl.getHelp(topic)
    },
  })

  builtinCommandNames.forEach((name) => {
    if (!commands.has(name)) {
      throw Error(`Command ${name} not registered`)
    }
  })
}
