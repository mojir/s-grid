import { isLitsFunction } from '@mojir/lits'
import type { CellReference } from '../reference/CellReference'
import type { Project } from '../project/Project'
import type { Result } from './cellTypes'

export function calculateDisplay({
  project,
  isEmpty,
  output,
  error,
  formattedNumber,
  formattedDate,
  formula,
  cellReference,
}:
{
  project: Project
  isEmpty: Ref<boolean>
  output: Ref<unknown>
  error: Ref<Error | undefined>
  formattedNumber: Ref<Result<string>>
  formattedDate: Ref<Result<string>>
  formula: Ref<string | undefined>
  cellReference: Ref<CellReference>
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
    const aliasName = project.aliases.reverseAliases.value[cellReference.value.toStringWithGrid()]
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
    return JSON.stringify(replaceInfinities(output.value))
      .replaceAll('"∞"', '∞')
      .replaceAll('"-∞"', '-∞')
  }

  return `${output.value}`
}
