import {
  isLitsError,
  isLitsFunction,
  normalExpressionKeys,
  specialExpressionKeys,
  apiReference,
  type Context,
  type ApiName,
  isFunctionReference,
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
  private suggestionHistory: { enteredText: string, suggestions: string[], index: number } | null = null

  public constructor(private project: Project) {}

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
      return `${command.name}
${command.description}`
    }
    const reference = apiReference[topic as ApiName]
    if (reference) {
      if (isFunctionReference(reference)) {
        return 'Builtin Lits function'
      }
    }
    return `Unknown command or function ${topic}`
  }

  private getAllSuggestions(enteredText: string): string[] {
    const commands = this.project.commandCenter.commands
    const startsWithParentheses = enteredText.startsWith('(')
    const searchPattern = (startsWithParentheses ? enteredText.substring(1).trim() : enteredText.trim()).toLowerCase()
    const suggestions = new Set<string>()
    const commandNames = Array.from(commands.keys())

    commandNames
      .filter(name => name.toLowerCase().startsWith(searchPattern))
      .forEach(name => suggestions.add(name))

    this.litsCommands.values()
      .filter(name => name.toLowerCase().startsWith(searchPattern))
      .forEach(name => suggestions.add(name))

    if (!startsWithParentheses) {
      commandNames
        .filter(name => name.toLowerCase().includes(searchPattern))
        .forEach(name => suggestions.add(name))

      this.litsCommands.values()
        .filter(name => name.toLowerCase().includes(searchPattern))
        .forEach(name => suggestions.add(name))
    }

    return [...suggestions]
  }

  private getNextSuggestion(enteredText: string): string {
    if (this.suggestionHistory === null) {
      const suggestions = this.getAllSuggestions(enteredText)
      this.suggestionHistory = {
        enteredText,
        suggestions,
        index: -1,
      }
    }
    this.suggestionHistory.index += 1
    if (this.suggestionHistory.index >= this.suggestionHistory.suggestions.length) {
      this.suggestionHistory.index = 0
    }
    return this.getSuggestionString(this.suggestionHistory.suggestions[this.suggestionHistory.index], enteredText)
  }

  private getPreviousSuggestion(enteredText: string): string {
    if (this.suggestionHistory === null) {
      const suggestions = this.getAllSuggestions(enteredText)
      this.suggestionHistory = {
        enteredText,
        suggestions,
        index: suggestions.length,
      }
    }
    this.suggestionHistory.index -= 1
    if (this.suggestionHistory.index < 0) {
      this.suggestionHistory.index = this.suggestionHistory.suggestions.length - 1
    }
    return this.getSuggestionString(this.suggestionHistory.suggestions[this.suggestionHistory.index], enteredText)
  }

  public getSuggestion(enteredText: string, direction: 'next' | 'previous'): string {
    if (direction === 'next') {
      return this.getNextSuggestion(enteredText)
    }
    return this.getPreviousSuggestion(enteredText)
  }

  private getSuggestionString(suggestion: string | undefined, enteredText: string): string {
    if (suggestion === undefined) {
      return enteredText
    }
    return suggestion.includes('-') ? `'${suggestion}'` : suggestion
  }

  public clearSuggestions() {
    this.suggestionHistory = null
  }

  public run(program: string) {
    let result
    try {
      const unresolvedIdentifiers = Array.from(this.lits.getUnresolvedIdentifers(program))
      const values = this.project.getValuesFromUndefinedIdentifiers(unresolvedIdentifiers, this.project.currentGrid.value)
      result = this.lits.run(program, {
        values,
        globalContext: this.globalContext,
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
