import { Lits, normalExpressionKeys, specialExpressionKeys, type Context, type JsFunction, type LitsFunction } from '@mojir/lits'
import { builtinLitsScript } from '~/lib/lits'
import { getInteropFunctions } from '~/lib/lits/interop'

type TokenStream = ReturnType<Lits['tokenize']>

const lits = new Lits()
const litsDebug = new Lits({ debug: true })

// console.log('***', builtinLitsScript)

const builtingContext = lits.context(builtinLitsScript)
const builtingContextDebug = litsDebug.context(builtinLitsScript)

let debugEnabled: Ref<boolean> = ref(false)

let interopFunctions: Record<string, JsFunction> = getInteropFunctions(ref(getLocalTimeZone()))

const { createLogger } = useLogger()

const logger = createLogger('Lits')
export type LitsComposable = ReturnType<typeof useLits>
export type RunLits = LitsComposable['run']
export type ApplyLits = LitsComposable['apply']

export default function useLits() {
  function setupRefs({
    timeZoneRef,
    debugEnabledRef,
  }: {
    timeZoneRef: Ref<TimeZone>
    debugEnabledRef: Ref<boolean>
  }) {
    debugEnabled = debugEnabledRef
    interopFunctions = getInteropFunctions(timeZoneRef)
  }

  function run(program: string, { values, globalContext }: { values?: Record<string, unknown>, globalContext?: Context } = {}) {
    try {
      return debugEnabled.value
        ? litsDebug.run(program, { jsFunctions: interopFunctions, contexts: [builtingContextDebug], values, globalContext })
        : lits.run(program, { jsFunctions: interopFunctions, contexts: [builtingContext], values, globalContext })
    }
    catch (error) {
      logger.warn('Lits operation "run" failed:', error)
      throw error
    }
  }

  function tokenize(program: string) {
    try {
      return debugEnabled.value
        ? litsDebug.tokenize(program)
        : lits.tokenize(program)
    }
    catch (error) {
      logger.warn('Lits operation "tokenize" failed:', error)
      throw error
    }
  }

  function transform(tokenStream: TokenStream, transformer: (identifier: string) => string) {
    try {
      return debugEnabled.value
        ? litsDebug.transformSymbols(tokenStream, transformer)
        : lits.transformSymbols(tokenStream, transformer)
    }
    catch (error) {
      logger.warn('Lits operation "transform" failed:', error)
      throw error
    }
  }

  function untokenize(tokenStream: TokenStream) {
    try {
      return debugEnabled.value
        ? litsDebug.untokenize(tokenStream)
        : lits.untokenize(tokenStream)
    }
    catch (error) {
      logger.warn('Lits operation "untokenize" failed:', error)
      throw error
    }
  }

  function apply(fn: LitsFunction, fnParams: unknown[], values: Record<string, unknown> = {}) {
    try {
      return debugEnabled.value
        ? litsDebug.apply(fn, fnParams, { jsFunctions: interopFunctions, contexts: [builtingContextDebug], values })
        : lits.apply(fn, fnParams, { jsFunctions: interopFunctions, contexts: [builtingContext], values })
    }
    catch (error) {
      logger.warn('Lits operation "apply" failed:', error)
      throw error
    }
  }

  function registerJsFunction(name: string, fn: JsFunction) {
    interopFunctions[name] = fn
  }

  function getUnresolvedIdentifers(program: string): Set<string> {
    return debugEnabled.value
      ? litsDebug.getUndefinedSymbols(program, { jsFunctions: interopFunctions, contexts: [builtingContextDebug] })
      : lits.getUndefinedSymbols(program, { jsFunctions: interopFunctions, contexts: [builtingContext] })
  }

  function getAutoCompleter(program: string, extraSymbols: string[]): AutoCompleter {
    return new AutoCompleter(lits, extraSymbols, program)
  }

  return {
    setupRefs,
    run,
    tokenize,
    untokenize,
    apply,
    transform,
    registerJsFunction,
    getUnresolvedIdentifers,
    getAutoCompleter,
  }
}
const litsCommands = new Set([...normalExpressionKeys, ...specialExpressionKeys, ...Object.keys(interopFunctions)].sort())

const autoCompleteTokenTypes = [
  'Operator',
  'ReservedSymbol',
  'Symbol',
]
export type Suggestion = {
  suggestion: string
  searchPattern: string
}
export class AutoCompleter {
  private searchPattern: string = ''
  private suggestions: string[] = []
  private suggestionIndex: null | number = null
  constructor(private lits: Lits, private extraSymbols: string[], program: string) {
    try {
      console.log('***', program)
      const tokenStream = this.lits.tokenize(program)
      const lastToken = tokenStream.tokens.at(-1)
      if (lastToken === undefined) {
        return
      }
      if (autoCompleteTokenTypes.includes(lastToken[0])) {
        this.searchPattern = lastToken[1].toLowerCase()
        this.suggestions = this.getAllSuggestions()
      }
    }
    catch {
      // Ignore errors
    }
  }

  public getNextSuggestion(): Suggestion | null {
    if (this.suggestions.length === 0) {
      return null
    }
    if (this.suggestionIndex === null) {
      this.suggestionIndex = 0
    }
    else {
      this.suggestionIndex += 1
      if (this.suggestionIndex >= this.suggestions.length) {
        this.suggestionIndex = 0
      }
    }
    return {
      suggestion: this.suggestions[this.suggestionIndex]!,
      searchPattern: this.searchPattern,
    }
  }

  public getPreviousSuggestion(): Suggestion | null {
    if (this.suggestions.length === 0) {
      return null
    }
    if (this.suggestionIndex === null) {
      this.suggestionIndex = this.suggestions.length - 1
    }
    else {
      this.suggestionIndex -= 1
      if (this.suggestionIndex < 0) {
        this.suggestionIndex = this.suggestions.length - 1
      }
    }
    return {
      suggestion: this.suggestions[this.suggestionIndex]!,
      searchPattern: this.searchPattern,
    }
  }

  private getAllSuggestions(): string[] {
    const suggestions = new Set<string>()

    this.extraSymbols
      .filter(name => name.toLowerCase().startsWith(this.searchPattern))
      .forEach(name => suggestions.add(name))

    litsCommands.values()
      .filter(name => name.toLowerCase().startsWith(this.searchPattern))
      .forEach(name => suggestions.add(name))

    this.extraSymbols
      .filter(name => name.toLowerCase().includes(this.searchPattern))
      .forEach(name => suggestions.add(name))

    litsCommands.values()
      .filter(name => name.toLowerCase().includes(this.searchPattern))
      .forEach(name => suggestions.add(name))

    return [...suggestions]
  }
}
