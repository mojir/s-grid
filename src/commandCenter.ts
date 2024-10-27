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
  'MoveActiveCellBy!',
  'MoveActiveCellTo!',
  'MoveActiveCellToCol!',
  'MoveActiveCellToLastCol!',
  'MoveActiveCellToLastRow!',
  'MoveActiveCellToRow!',
  'SetCellInput!',
] as const

type BuiltinCommandName = typeof builtinCommandNames[number]

type JsFunctions = NonNullable<LitsParams['jsFunctions']>

type Command<T extends string> = {
  name: T
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => unknown
}


class CommandCenter {
  private commands: Map<string, Command<string>> = new Map()
  private readonly _jsFunctions: JsFunctions = {}

  public registerCommand(command: Command<BuiltinCommandName>) {
    if (this.commands.has(command.name)) {
      console.error(`Command ${command.name} already exists`)
      return
    }
    this.commands.set(command.name, command)
    this._jsFunctions[command.name] = { fn: (...args: unknown[]) => this.exec(command.name, ...args) }
  }

  public exec(name: string, ...args: unknown[]) {
    console.log('exec', name, args)
    const command = this.commands.get(name)
    if (!command) {
      console.error(`Command ${name} not found`)
      return
    }
    return command.execute(...args)
  }

  public get jsFunctions() {
    return this._jsFunctions
  }
}

let commandCenter: CommandCenter | null = null
export function getCommandCenter(): CommandCenter {
  commandCenter = commandCenter || new CommandCenter()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ; (window as any).commandCenter = commandCenter
  return commandCenter
}

