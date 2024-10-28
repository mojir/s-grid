import type { LitsParams } from '@mojir/lits'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const builtinCommandNames = [
  'ClearActiveCell!',
  'ClearCell!',
  'ClearAllCells!',
  'GetActiveCellDisplayValue',
  'GetActiveCellId',
  'GetActiveCellInput',
  'GetActiveCellOutput',
  'GetCellDisplayValue',
  'GetCellInput',
  'GetCellOutput',
  'MoveActiveCell!',
  'MoveActiveCellTo!',
  'MoveActiveCellToCol!',
  'MoveActiveCellToFirstRow!',
  'MoveActiveCellToFirstCol!',
  'MoveActiveCellToLastRow!',
  'MoveActiveCellToLastCol!',
  'MoveActiveCellToRow!',
  'SetCellInput!',
  'SetSelection!',
  'ResetSelection!',
  'GetSelection',
  'MoveSelection!',
  'ExpandSelection!',
  'CreateCellAlias!',
  'RenameCellAlias!',
] as const

type BuiltinCommandName = typeof builtinCommandNames[number]

type JsFunctions = NonNullable<LitsParams['jsFunctions']>

type Command<T extends string> = {
  name: T
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => unknown
}

export const useCommandCenter = createSharedComposable(() => {
  const commands: Map<string, Command<string>> = new Map()
  const jsFunctions: JsFunctions = {}

  function registerCommand(command: Command<BuiltinCommandName>) {
    commands.set(command.name, command)
    jsFunctions[command.name] = { fn: (...args: unknown[]) => exec(command.name, ...args) }
  }

  function exec(name: string, ...args: unknown[]) {
    console.log('exec', name, args)
    const command = commands.get(name)
    if (!command) {
      console.error(`Command ${name} not found`)
      return
    }
    return command.execute(...args)
  }

  return {
    jsFunctions,
    registerCommand,
    exec,
  }
})
