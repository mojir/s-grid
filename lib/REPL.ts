import {
  isLitsError,
  isLitsFunction,
  normalExpressionKeys,
  specialExpressionKeys,
  apiReference,
  type Context,
  type ApiName,
  isFunctionReference,
  type AutoCompleter,
} from '@mojir/lits'
import type { Project } from './project/Project'
import { interopFunctionNames } from './lits/interop'

type HistoryEntry = {
  program: string
  result: string | null
}

const HISTORY_SIZE = 500

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null
    && typeof obj === 'object'
    && !Array.isArray(obj)
    && Object.prototype.toString.call(obj) === '[object Object]'
}

function isHistoryEntry(obj: unknown): obj is HistoryEntry {
  if (!isPlainObject(obj)) {
    return false
  }

  // Get all keys
  const keys = Object.keys(obj)

  // Must have exactly 2 keys
  if (keys.length !== 2) {
    return false
  }

  // Must have 'program' and 'result' keys
  if (!keys.includes('program') || !keys.includes('result')) {
    return false
  }

  // Check types
  if (typeof obj.program !== 'string') {
    return false
  }

  if (obj.result !== null && typeof obj.result !== 'string') {
    return false
  }

  return true
}

function isHistory(value: unknown): value is HistoryEntry[] {
  if (!Array.isArray(value)) {
    return false
  }
  if (!value.every(isHistoryEntry)) {
    return false
  }
  return true
}

export class REPL {
  private lits = useLits()
  private litsCommands = new Set([...normalExpressionKeys, ...specialExpressionKeys, ...interopFunctionNames].sort())
  private historyIndex = -1
  private globalContext: Context = {}
  private historyState = ref<HistoryEntry[]>([])

  public history = computed<HistoryEntry[]>({
    get: () => this.historyState.value,
    set: (value: HistoryEntry[]) => {
      this.historyState.value = value.slice(-HISTORY_SIZE)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('repl-history', JSON.stringify(this.historyState.value))
      }
    },
  })

  private autoCompleter: AutoCompleter | null = null

  public constructor(private project: Project) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    const savedHistory = window.localStorage.getItem('repl-history')
    if (!savedHistory) {
      return
    }
    try {
      const history = JSON.parse(savedHistory)
      if (isHistory(history)) {
        this.history.value = history
      }
      else {
        this.history.value = []
      }
    }
    catch {
      this.history.value = []
    }
  }

  public clearRepl() {
    nextTick(() => {
      this.history.value = []
      this.resetHistoryIndex()
      this.clearSuggestions()
      this.globalContext = {}
    })
  }

  public getHelp(topic?: string): string {
    const commands = this.project.commandCenter.commands
    if (!topic) {
      let result = 'Commands:\n'
      Array.from(commands.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((command) => {
          result += `${command.name}\n${command.description}\n\n`
        })
      return result
    }
    const command = commands.get(topic)
    if (command) {
      return command.description
    }
    const reference = apiReference[topic as ApiName]
    if (reference) {
      if (isFunctionReference(reference)) {
        return 'Builtin Lits function'
      }
    }
    return `Unknown command or function ${topic}`
  }

  public getSuggestion(text: string, position: number, direction: 'next' | 'previous') {
    if (!this.autoCompleter) {
      const program = text.slice(0, position)
      this.autoCompleter = this.lits.getAutoCompleter(program, position, { globalContext: this.globalContext })
    }

    return direction === 'next'
      ? this.autoCompleter.getNextSuggestion()
      : this.autoCompleter.getPreviousSuggestion()
  }

  public clearSuggestions() {
    if (this.autoCompleter) {
      const result = {
        program: this.autoCompleter.originalProgram,
        position: this.autoCompleter.originalPosition,
      }
      this.autoCompleter = null
      return result
    }
    return null
  }

  public run(program: string) {
    let result
    try {
      const unresolvedIdentifiers = Array.from(this.lits.getUnresolvedIdentifers(program))
      const values = this.project.getValuesFromUndefinedIdentifiers(unresolvedIdentifiers, this.project.currentGrid.value)
      result = this.lits.run(program, {
        values,
        globalContext: this.globalContext,
        repl: true,
      })
    }
    catch (error) {
      result = error
    }

    this.history.value = [...this.history.value, { program, result: this.stringifyLitsResult(result) }]
    this.historyIndex = -1
  }

  private stringifyLitsResult(result: unknown): string | null {
    if (typeof result === 'string') {
      return result.trim()
    }
    if (isLitsFunction(result)) {
      return 'λ'
    }
    if (isLitsError(result)) {
      return result.message
    }
    return JSON.stringify(result, null, 2)
  }

  public resetHistoryIndex() {
    this.historyIndex = -1
  }

  private getHistoryEntry() {
    if (this.historyIndex === -1) {
      return ''
    }
    return this.history.value[this.history.value.length - this.historyIndex - 1]?.program ?? ''
  }

  private getPreviousHistoryCommand() {
    this.historyIndex = Math.min(this.historyIndex + 1, this.history.value.length - 1)
    return this.getHistoryEntry()
  }

  private getNextHistoryCommand() {
    this.historyIndex = Math.max(-1, this.historyIndex - 1)
    return this.getHistoryEntry()
  }

  private getFirstHistoryCommand() {
    this.historyIndex = this.history.value.length - 1
    return this.getHistoryEntry()
  }

  private getLastHistoryCommand() {
    this.historyIndex = -1
    return this.getHistoryEntry()
  }

  public getHistory(val: 'next' | 'previous' | 'first' | 'last') {
    switch (val) {
      case 'next':
        return this.getNextHistoryCommand()
      case 'previous':
        return this.getPreviousHistoryCommand()
      case 'first':
        return this.getFirstHistoryCommand()
      case 'last':
        return this.getLastHistoryCommand()
    }
  }
}
