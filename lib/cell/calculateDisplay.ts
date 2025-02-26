import { isLitsFunction } from '@mojir/lits'
import type { Result } from './cellTypes'

export function calculateDisplay({
  input,
  output,
  error,
  formattedNumber,
  formattedDate,
}:
{
  input: Ref<string>
  output: Ref<unknown>
  error: Ref<Error | undefined>
  formattedNumber: Ref<Result<string>>
  formattedDate: Ref<Result<string>>
}): string {
  if (input.value === '') {
    return ''
  }
  const errorDisplay = '#ERR'
  if (error.value) {
    return errorDisplay
  }

  if (output.value === null || output.value === undefined) {
    return ''
  }

  if (isLitsFunction(output.value)) {
    // TODO, this is a temporary solution
    // We can have many aliases for a cell, we should handle this
    // const alias = this.project.aliases.getAliases(this.cellReference)[0]

    // return `${alias ? `${alias} ` : ''}λ`
    return 'λ'
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
