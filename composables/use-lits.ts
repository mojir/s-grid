import { Lits, type Context, type JsFunction, type LitsFunction } from '@mojir/lits'
import type { TokenStream } from '@mojir/lits/dist/src/tokenizer/interface'
import { builtinLitsScript } from '~/lib/lits'
import { d3Format } from '~/lib/lits/interop/d3-lits'
import { getDateFnsFormat, getDateFnsParse, getDateFnsSmartParse } from '~/lib/lits/interop/date-fns-lits'

const lits = new Lits()
const litsDebug = new Lits({ debug: true })

const builtingContext = lits.context(builtinLitsScript)
const builtingContextDebug = litsDebug.context(builtinLitsScript)

const { timeZone } = useTimeZone()

const jsFunctions: Record<string, JsFunction> = {
  'd3:format': d3Format,
  'date-fns:parse': getDateFnsParse(timeZone),
  'date-fns:smart-parse': getDateFnsSmartParse(timeZone),
  'date-fns:format': getDateFnsFormat(timeZone),
}
const { debugEnabled } = useDebug()
const { createLogger } = useLogger()

const logger = createLogger('Lits')
export default function useLits() {
  function run(program: string, { values, globalContext }: { values?: Record<string, unknown>, globalContext?: Context } = {}) {
    try {
      return debugEnabled.value
        ? litsDebug.run(program, { jsFunctions, contexts: [builtingContextDebug], values, globalContext })
        : lits.run(program, { jsFunctions, contexts: [builtingContext], values, globalContext })
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
        ? litsDebug.apply(fn, fnParams, { jsFunctions, contexts: [builtingContextDebug], values })
        : lits.apply(fn, fnParams, { jsFunctions, contexts: [builtingContext], values })
    }
    catch (error) {
      logger.warn('Lits operation "apply" failed:', error)
      throw error
    }
  }

  function registerJsFunction(name: string, fn: JsFunction) {
    jsFunctions[name] = fn
  }

  function getUnresolvedIdentifers(program: string): Set<string> {
    const analyzeResult = debugEnabled.value
      ? litsDebug.analyze(program, { jsFunctions, contexts: [builtingContextDebug] }).unresolvedIdentifiers
      : lits.analyze(program, { jsFunctions, contexts: [builtingContext] }).unresolvedIdentifiers

    return new Set(Array.from(analyzeResult).map(identifier => identifier.symbol))
  }

  return {
    run,
    tokenize,
    untokenize,
    apply,
    transform,
    registerJsFunction,
    getUnresolvedIdentifers,
  }
}

export type LitsComposable = ReturnType<typeof useLits>
