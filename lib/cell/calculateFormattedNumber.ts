import { isLitsFunction } from '@mojir/lits'
import type { DerivedType, Result } from './cellTypes'

export function calculateFormattedNumber({
  derivedType,
  isEmpty,
  output,
  numberFormatter,
  run,
  apply,
}:
{
  derivedType: Ref<DerivedType>
  isEmpty: Ref<boolean>
  output: Ref<unknown>
  numberFormatter: Ref<string>
  run: RunLits
  apply: ApplyLits
}): Result<string> {
  if (isEmpty.value) {
    return {}
  }
  if (derivedType.value === 'number') {
    if (typeof output.value === 'number') {
      const formattedNumber = formatNumber({
        value: output.value,
        numberFormatter: numberFormatter.value,
        run,
        apply,
      })
      return formattedNumber instanceof Error
        ? { error: formattedNumber }
        : { result: formattedNumber }
    }
    return { error: new Error('Invalid number') }
  }
  return {}
}

function formatNumber({
  numberFormatter,
  value,
  run,
  apply,
}:
{
  numberFormatter: string
  value: number
  run: RunLits
  apply: ApplyLits
}): string | Error {
  try {
    const fn = run(numberFormatter)

    if (!isLitsFunction(fn)) {
      return new Error('Invalid number formatter, expected lamda function')
    }
    const result = apply(fn, [value])
    if (typeof result === 'string') {
      return result
    }
    if (typeof result === 'number') {
      return `${result}`
    }
    return new Error('Invalid number formatter, it must return string or number, got ${typeof result}')
  }
  catch (error) {
    return error instanceof Error ? error : new Error('Unknown error')
  }
}
