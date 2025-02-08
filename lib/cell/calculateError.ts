import type { Result } from './cellTypes'
import type { CellType } from '~/dto/CellDTO'

export function calculateError({
  output,
  formulaResult,
  formattedNumber,
  formattedDate,
  cellType,
  isoDate,
}: {
  output: Ref<unknown>
  formulaResult: Ref<Result>
  formattedNumber: Ref<Result<string>>
  formattedDate: Ref<Result<string>>
  cellType: Ref<CellType>
  isoDate: Ref<Date | undefined>
}): Error | undefined {
  if (output.value === null) {
    return
  }
  if (output.value instanceof Error) {
    return output.value
  }
  if (formulaResult.value.error) {
    return formulaResult.value.error
  }
  if (formattedNumber.value.error) {
    return formattedNumber.value.error
  }
  if (formattedDate.value.error) {
    return formattedDate.value.error
  }
  if (cellType.value === 'number' && typeof output.value !== 'number') {
    return new Error('Invalid number')
  }
  if (cellType.value === 'date' && !isoDate.value) {
    return new Error('Invalid date')
  }
  if (cellType.value === 'string' && typeof output.value !== 'string' && typeof output.value !== 'number') {
    return new Error('Invalid string')
  }
  return
}
