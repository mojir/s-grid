import { isLitsFunction } from '@mojir/lits'
import type { Result } from './cellTypes'

export function calculateDisplay({
  isEmpty,
  output,
  error,
  formattedNumber,
  formattedDate,
  formula,
  reverseAliases,
  referenceString,
}:
{
  isEmpty: Ref<boolean>
  output: Ref<unknown>
  error: Ref<Error | undefined>
  formattedNumber: Ref<Result<string>>
  formattedDate: Ref<Result<string>>
  formula: Ref<string | undefined>
  reverseAliases: Ref<Record<string, string>>
  referenceString: string
}): string {
  if (isEmpty.value) {
    return ''
  }
  const errorDisplay = '#ERR'
  if (error.value) {
    return errorDisplay
  }

  if (output.value === null) {
    return 'null'
  }

  if (isLitsFunction(output.value)) {
    const aliasName = reverseAliases.value[referenceString]
    return aliasName
      ? `λ: ${aliasName}`
      : formula.value
        ? `λ: ${formula.value}`
        : 'λ'
  }

  if (typeof formattedNumber.value.result === 'string') {
    return formattedNumber.value.result
  }

  if (formattedDate.value.result) {
    return formattedDate.value.result
  }

  if (typeof output.value === 'object') {
    return JSON.stringify(output.value)
  }

  return `${output.value}`
}
