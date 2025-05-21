import { Lits, type Context, type JsFunction, type LitsFunction } from '@mojir/lits'
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

  function run(program: string, { values, globalContext, repl }: { values?: Record<string, unknown>, globalContext?: Context, repl?: boolean } = {}) {
    try {
      return debugEnabled.value
        ? litsDebug.run(program, { jsFunctions: interopFunctions, contexts: [builtingContextDebug], values, globalContext, globalModuleScope: !!repl })
        : lits.run(program, { jsFunctions: interopFunctions, contexts: [builtingContext], values, globalContext, globalModuleScope: !!repl })
    }
    catch (error) {
      logger.warn('Lits operation "run" failed:', error)
      throw error
    }
  }

  function getAutoCompleter(program: string, position: number, { values, globalContext }: { values?: Record<string, unknown>, globalContext?: Context } = {}) {
    try {
      return debugEnabled.value
        ? litsDebug.getAutoCompleter(program, position, { jsFunctions: interopFunctions, contexts: [builtingContextDebug], values, globalContext })
        : lits.getAutoCompleter(program, position, { jsFunctions: interopFunctions, contexts: [builtingContext], values, globalContext })
    }
    catch (error) {
      logger.warn('Lits operation "getAutoCompleter" failed:', error)
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
