import { Lits, type Context, type JsFunction, type LitsFunction } from '@mojir/lits'
import type { TokenStream } from '@mojir/lits/dist/src/tokenizer/interface'
import { builtinLitsScript } from '~/lib/lits'
import { getInteropFunctions } from '~/lib/lits/interop'

const lits = new Lits({ algebraic: true })
const litsDebug = new Lits({ debug: true, algebraic: true })

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
        ? litsDebug.transform(tokenStream, transformer)
        : lits.transform(tokenStream, transformer)
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
    const analyzeResult = debugEnabled.value
      ? litsDebug.analyze(program, { jsFunctions: interopFunctions, contexts: [builtingContextDebug] }).unresolvedIdentifiers
      : lits.analyze(program, { jsFunctions: interopFunctions, contexts: [builtingContext] }).unresolvedIdentifiers

    return new Set(Array.from(analyzeResult).map(identifier => identifier.symbol))
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
  }
}
