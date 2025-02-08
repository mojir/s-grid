import type { DerivedType } from './cellTypes'
import type { CellType } from '~/dto/CellDTO'

export function calculateDerivedType({
  cellType,
  numberInput,
  isoDate,
  output,
}: {
  cellType: Ref<CellType>
  numberInput: Ref<number | undefined>
  isoDate: Ref<Date | undefined>
  output: Ref<unknown>
}): DerivedType {
  if (cellType.value !== 'auto') {
    return cellType.value
  }

  if (numberInput.value !== undefined) {
    return 'number'
  }

  if (isoDate.value) {
    return 'date'
  }

  if (typeof output.value === 'number') {
    return 'number'
  }

  if (typeof output.value === 'string') {
    return 'string'
  }

  return 'unknown'
}
