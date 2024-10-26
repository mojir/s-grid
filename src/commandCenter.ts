import type { LitsParams } from '@mojir/lits'

type JsFunctions = NonNullable<LitsParams['jsFunctions']>

type Command = {
  name: string
  description: string
  execute: (...args: unknown[]) => unknown
}


class CommandCenter {
  private commands: Map<string, Command> = new Map()
  private readonly _jsFunctions: JsFunctions = {}

  public registerCommand(command: Command) {
    if (this.commands.has(command.name)) {
      throw new Error(`Command ${command.name} already exists`)
    }
    this.commands.set(command.name, command)
    this._jsFunctions[command.name] = { fn: (...args: unknown[]) => this.exec(command.name, ...args) }
  }

  public exec(name: string, ...args: unknown[]) {
    console.log('exec', name, args)
    const command = this.commands.get(name)
    if (!command) {
      throw new Error(`Command ${name} not found`)
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
  return commandCenter
}

