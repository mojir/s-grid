import { isLitsError, isLitsFunction, Lits, type Context } from '@mojir/lits'

type HistoryEntry = {
  program: string
  result: string | null
}

let historyIndex = -1
const lits = new Lits()

let globalContext: Context = {}

const { jsFunctions, getCommandNames } = useCommandCenter()
const { grid } = useGrid()
const { registerCommand } = useCommandCenter()

const history = ref<HistoryEntry[]>([])
const replFocused = ref(false)

registerCommand({
  name: 'ClearRepl!',
  description: 'Clear the Repl history',
  execute: () => {
    nextTick(() => {
      history.value = []
      resetHistoryIndex()
      clearSuggestions()
    })
  },
})

registerCommand({
  name: 'RestartRepl!',
  description: 'Clear the Repl Lits context',
  execute: () => {
    globalContext = {}
    return 'Repl context cleared'
  },
})

let suggestionHistory: { enteredText: string, suggestions: string[], index: number } | null = null

function getNextSuggestion(enteredText: string): string {
  if (suggestionHistory === null) {
    const prefix = enteredText.startsWith('(') ? enteredText.substring(1).trim() : enteredText.trim()
    suggestionHistory = {
      enteredText,
      suggestions: getCommandNames().filter(name => name.startsWith(prefix)),
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
    const prefix = enteredText.startsWith('(') ? enteredText.substring(1).trim() : enteredText.trim()
    const suggestions = getCommandNames().filter(name => name.startsWith(prefix))
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
    const { unresolvedIdentifiers } = lits.analyze(program, { jsFunctions })
    const values = grid.value.getValuesFromUndefinedIdentifiers(unresolvedIdentifiers)

    result = lits.run(program, { values, jsFunctions, globalContext })
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

export function useREPL() {
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
    replFocused,
    getSuggestion,
    clearSuggestions,
  }
}
