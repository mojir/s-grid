import type { LitsParams } from '@mojir/lits'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const builtinCommandNames = [
  'ClearCell!',
  'ClearRange!',
  'ClearAllCells!',
  'ClearRepl!',
  'SetAlias!',
  'ExpandSelection!',
  'GetCurrentCell',
  'GetCell',
  'GetSelection',
  'Help',
  'MovePosition!',
  'MovePositionTo!',
  'MovePositionToCol!',
  'MovePositionToFirstCol!',
  'MovePositionToFirstRow!',
  'MovePositionToLastCol!',
  'MovePositionToLastRow!',
  'MovePositionToRow!',
  'ResetSelection!',
  'RestartRepl!',
  'SetInput!',
  'SetSelection!',
  'SetStyle!',
  'SetBackgroundColor!',
  'SetTextColor!',
  'SetFormatter!',
] as const

type BuiltinCommandName = typeof builtinCommandNames[number]

type JsFunctions = NonNullable<LitsParams['jsFunctions']>

type Command<T extends string> = {
  name: T
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => unknown
}

const commands = ref(new Map<string, Command<string>>())
const jsFunctions: JsFunctions = {}

function registerCommand(command: Command<BuiltinCommandName>) {
  commands.value.set(command.name, command)
  jsFunctions[command.name] = { fn: (...args: unknown[]) => exec(command.name, ...args) }
}

function exec(name: BuiltinCommandName, ...args: unknown[]) {
  const command = commands.value.get(name)
  if (!command) {
    console.error(`Command ${name} not found`)
    return
  }
  return command.execute(...args)
}

export const useCommandCenter = () => {
  return {
    jsFunctions,
    registerCommand,
    exec,
    commands,
  }
}
