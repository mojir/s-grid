import type { LitsParams } from '@mojir/lits'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const builtinCommandNames = [
  'Clear!',
  'ClearAllCells!',
  'ClearRepl!',
  'CreateCellAlias!',
  'ExpandSelection!',
  'GetActiveCellDisplayValue',
  'GetActiveCellId',
  'GetActiveCellInput',
  'GetActiveCellOutput',
  'GetCellDisplayValue',
  'GetCellInput',
  'GetCellOutput',
  'GetSelection',
  'Help',
  'MoveActiveCell!',
  'MoveActiveCellTo!',
  'MoveActiveCellToCol!',
  'MoveActiveCellToFirstCol!',
  'MoveActiveCellToFirstRow!',
  'MoveActiveCellToLastCol!',
  'MoveActiveCellToLastRow!',
  'MoveActiveCellToRow!',
  'RenameCellAlias!',
  'ResetSelection!',
  'RestartRepl!',
  'SetCellInput!',
  'SetSelection!',
] as const

type BuiltinCommandName = typeof builtinCommandNames[number]

type JsFunctions = NonNullable<LitsParams['jsFunctions']>

type Command<T extends string> = {
  name: T
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => unknown
}

const commands: Map<string, Command<string>> = new Map()
const jsFunctions: JsFunctions = {}

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
  return {
    jsFunctions,
    registerCommand,
    exec,
    getCommandNames: () => Array.from(commands.keys()).sort(),
  }
}

registerCommand({
  name: 'Help',
  description: 'Get the list of available commands',
  execute: (topic?: string) => {
    if (!topic) {
      let result = 'Commands:\n'
      Array.from(commands.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((command) => {
          result += `  ${command.name}: ${command.description}\n`
        })
      return result
    }
    const command = commands.get(topic)
    if (!command) {
      return `Command ${topic} not found`
    }
    return `${command.name}
  ${command.description}`
  },
})
