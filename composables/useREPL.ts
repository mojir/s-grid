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

type HistoryEntry = {
  program: string
  result: string | null
}

export const useREPL = createSharedComposable(() => {
  const lits = useLits()
  const litsCommands = new Set([...normalExpressionKeys, ...specialExpressionKeys].sort())
  const grid = useGrid()
  const { jsFunctions, commands } = useCommandCenter()

  let historyIndex = -1

  let globalContext: Context = {}

  const history = ref<HistoryEntry[]>([])

  function clearRepl() {
    nextTick(() => {
      history.value = []
      resetHistoryIndex()
      clearSuggestions()
    })
  }

  function restartRepl() {
    globalContext = {}
  }

  function getHelp(topic?: string): string {
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

  let suggestionHistory: { enteredText: string, suggestions: string[], index: number } | null = null

  function getAllSuggestions(enteredText: string): string[] {
    const startsWithParentheses = enteredText.startsWith('(')
    const searchPattern = (startsWithParentheses ? enteredText.substring(1).trim() : enteredText.trim()).toLowerCase()
    const suggestions = new Set<string>()
    const commandNames = Array.from(commands.keys())

    commandNames
      .filter(name => name.toLowerCase().startsWith(searchPattern))
      .forEach(name => suggestions.add(name))

    litsCommands.values()
      .filter(name => name.toLowerCase().startsWith(searchPattern))
      .forEach(name => suggestions.add(name))

    if (!startsWithParentheses) {
      commandNames
        .filter(name => name.toLowerCase().includes(searchPattern))
        .forEach(name => suggestions.add(name))

      litsCommands.values()
        .filter(name => name.toLowerCase().includes(searchPattern))
        .forEach(name => suggestions.add(name))
    }

    return [...suggestions]
  }

  function getNextSuggestion(enteredText: string): string {
    if (suggestionHistory === null) {
      const suggestions = getAllSuggestions(enteredText)
      suggestionHistory = {
        enteredText,
        suggestions,
        index: -1,
      }
    }
    suggestionHistory.index += 1
    if (suggestionHistory.index >= suggestionHistory.suggestions.length) {
      suggestionHistory.index = 0
    }
    return getSuggestionString(suggestionHistory.suggestions[suggestionHistory.index], enteredText)
  }

  function getPreviousSuggestion(enteredText: string): string {
    if (suggestionHistory === null) {
      const suggestions = getAllSuggestions(enteredText)
      suggestionHistory = {
        enteredText,
        suggestions,
        index: suggestions.length,
      }
    }
    suggestionHistory.index -= 1
    if (suggestionHistory.index < 0) {
      suggestionHistory.index = suggestionHistory.suggestions.length - 1
    }
    return getSuggestionString(suggestionHistory.suggestions[suggestionHistory.index], enteredText)
  }

  function getSuggestion(enteredText: string, direction: 'next' | 'previous'): string {
    if (direction === 'next') {
      return getNextSuggestion(enteredText)
    }
    return getPreviousSuggestion(enteredText)
  }

  function getSuggestionString(suggestion: string | undefined, enteredText: string): string {
    if (suggestion === undefined) {
      return enteredText
    }
    return `(${suggestion ?? ''})`
  }

  function clearSuggestions() {
    suggestionHistory = null
  }

  function run(program: string) {
    let result
    try {
      const { unresolvedIdentifiers } = lits.value.analyze(program, { jsFunctions })
      const values = grid.value.getValuesFromUndefinedIdentifiers(Array.from(unresolvedIdentifiers).map(identifier => identifier.symbol))
      result = lits.value.run(program, { values, jsFunctions, globalContext })
    }
    catch (error) {
      result = error
    }

    history.value = [...history.value, { program, result: stringifyLitsResult(result) }]
    historyIndex = -1
  }

  function stringifyLitsResult(result: unknown): string | null {
    if (typeof result === 'string') {
      return result.trim()
    }
    if (isLitsFunction(result)) {
      return 'λ'
    }
    if (isLitsError(result)) {
      return result.message
    }
    if (result === null) {
      return null
    }
    return JSON.stringify(result, null, 2)
  }

  function resetHistoryIndex() {
    historyIndex = -1
  }

  function getHistoryEntry() {
    if (historyIndex === -1) {
      return ''
    }
    return history.value[history.value.length - historyIndex - 1].program ?? ''
  }

  function getPreviousHistoryCommand() {
    historyIndex = Math.min(historyIndex + 1, history.value.length - 1)
    return getHistoryEntry()
  }
  function getNextHistoryCommand() {
    historyIndex = Math.max(-1, historyIndex - 1)
    return getHistoryEntry()
  }
  function getFirstHistoryCommand() {
    historyIndex = history.value.length - 1
    return getHistoryEntry()
  }
  function getLastHistoryCommand() {
    historyIndex = -1
    return getHistoryEntry()
  }

  return {
    history: readonly(history),
    getHistory(val: 'next' | 'previous' | 'first' | 'last') {
      switch (val) {
        case 'next':
          return getNextHistoryCommand()
        case 'previous':
          return getPreviousHistoryCommand()
        case 'first':
          return getFirstHistoryCommand()
        case 'last':
          return getLastHistoryCommand()
      }
    },
    resetHistoryIndex,
    run,
    getSuggestion,
    clearSuggestions,
    getHelp,
    clearRepl,
    restartRepl,
  }
})
