import { Lits, type Context, type JsFunction, type LitsFunction } from '@mojir/lits'
import type { TokenStream } from '@mojir/lits/dist/src/tokenizer/interface'
import { builtinLitsScript } from '../lib/lits'
import { format } from '~/lib/litsInterop/format'

const lits = new Lits()
const litsDebug = new Lits({ debug: true })

const builtingContext = lits.context(builtinLitsScript)
const builtingContextDebug = litsDebug.context(builtinLitsScript)

const jsFunctions: Record<string, JsFunction> = {
  format,
}

export default function useLits() {
  const { debugMode } = useDebug()

  function run(program: string, { values, globalContext }: { values?: Record<string, unknown>, globalContext?: Context } = {}) {
    return debugMode.value
      ? litsDebug.run(program, { jsFunctions, contexts: [builtingContextDebug], values, globalContext })
      : lits.run(program, { jsFunctions, contexts: [builtingContext], values, globalContext })
  }

  function tokenize(program: string) {
    return debugMode.value
      ? litsDebug.tokenize(program)
      : lits.tokenize(program)
  }

  function transform(tokenStream: TokenStream, transformer: (identifier: string) => string) {
    return debugMode.value
      ? litsDebug.transform(tokenStream, transformer)
      : lits.transform(tokenStream, transformer)
  }

  function untokenize(tokenStream: TokenStream) {
    return debugMode.value
      ? litsDebug.untokenize(tokenStream)
      : lits.untokenize(tokenStream)
  }

  function apply(fn: LitsFunction, fnParams: unknown[], values: Record<string, unknown> = {}) {
    return debugMode.value
      ? litsDebug.apply(fn, fnParams, { jsFunctions, contexts: [builtingContextDebug], values })
      : lits.apply(fn, fnParams, { jsFunctions, contexts: [builtingContext], values })
  }

  function registerJsFunction(name: string, fn: JsFunction) {
    jsFunctions[name] = fn
  }

  function getUnresolvedIdentifers(program: string): Set<string> {
    const analyzeResult = debugMode.value
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
