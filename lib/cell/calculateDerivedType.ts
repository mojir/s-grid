import { isGrid, isLitsFunction, isMatrix, isVector } from '@mojir/lits'
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

  if (output.value === null) {
    return 'null'
  }

  if (isMatrix(output.value)) {
    return 'matrix'
  }

  if (isGrid(output.value)) {
    return 'grid'
  }

  if (isVector(output.value)) {
    return 'vector'
  }

  if (Array.isArray(output.value)) {
    return 'array'
  }

  if (isLitsFunction(output.value)) {
    return 'function'
  }

  return 'unknown'
}
