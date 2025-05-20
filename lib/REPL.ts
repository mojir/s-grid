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

export class REPL {
  private lits = useLits()
  private litsCommands = new Set([...normalExpressionKeys, ...specialExpressionKeys, ...interopFunctionNames].sort())
  private historyIndex = -1
  private globalContext: Context = {}
  public history = ref<HistoryEntry[]>([])
  private autoCompleting: {
    originalText: string
    cursorPosition: number
    autoCompleter: AutoCompleter
  } | null = null

  public constructor(private project: Project) { }

  public clearRepl() {
    nextTick(() => {
      this.history.value = []
      this.resetHistoryIndex()
      this.clearSuggestions()
      this.globalContext = {}
    })
  }

  public restartRepl() {
    this.globalContext = {}
  }

  public getHelp(topic?: string): string {
    const commands = this.project.commandCenter.commands
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
    if (command) {
      return `${command.name}\n${command.description}`
    }
    const reference = apiReference[topic as ApiName]
    if (reference) {
      if (isFunctionReference(reference)) {
        return 'Builtin Lits function'
      }
    }
    return `Unknown command or function ${topic}`
  }

  public getSuggestion(text: string, position: number, direction: 'next' | 'previous'): { value: string, cursorPosition: number } | null {
    console.log('getSuggestion', { text, position, direction, autoCompleting: !!this.autoCompleting })
    if (!this.autoCompleting) {
      const program = text.slice(0, position)
      this.autoCompleting = {
        autoCompleter: this.lits.getAutoCompleter(program, { globalContext: this.globalContext }),
        cursorPosition: position,
        originalText: text,
      }
    }

    const result = direction === 'next'
      ? this.autoCompleting.autoCompleter.getNextSuggestion()
      : this.autoCompleting.autoCompleter.getPreviousSuggestion()

    if (result === null) {
      return null
    }

    const { originalText, cursorPosition } = this.autoCompleting
    const before = originalText.slice(0, cursorPosition - result.searchPattern.length)
    const after = originalText.slice(before.length + result.searchPattern.length)

    return {
      value: before + result.suggestion + after,
      cursorPosition: before.length + result.suggestion.length,
    }
  }

  public clearSuggestions(): { value: string, cursorPosition: number } | null {
    if (this.autoCompleting) {
      const result = {
        value: this.autoCompleting.originalText,
        cursorPosition: this.autoCompleting.cursorPosition,
      }
      this.autoCompleting = null
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
