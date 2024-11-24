import { isLitsError } from '@mojir/lits'
import type { RangeLocator } from '../locator/RangeLocator'
import { isRangeLocatorString } from '../locator/RangeLocator'
import type { Movement } from '../locator/utils'
import type { RowRangeLocator } from '../locator/RowRangeLocator'
import { isCellLocatorString } from '../locator/CellLocator'
import type { ColRangeLocator } from '../locator/ColRangeLocator'
import { transformRange } from './rangeTransformers'
import { transformCell } from './cellTransformers'

export type FormulaTransformation = {
  type: 'move'
  range?: RangeLocator
  movement: Movement
} | {
  type: 'rowDelete'
  rowRangeLocator: RowRangeLocator
} | {
  type: 'colDelete'
  colRangeLocator: ColRangeLocator
} | {
  type: 'rowInsertBefore'
  rowRangeLocator: RowRangeLocator
} | {
  type: 'colInsertBefore'
  colRangeLocator: ColRangeLocator
}

export function transformGridReference(program: string, transformation: FormulaTransformation): string {
  const lits = useLits().value
  const tokenStream = lits.tokenize(program)
  const transformedTokenStream = lits.transform(tokenStream, name => transformName(name, transformation))
  return lits.untokenize(transformedTokenStream)
}

function transformName(name: string, transformation: FormulaTransformation): string {
  try {
    if (isCellLocatorString(name)) {
      return transformCell(name, transformation)
    }
    else if (isRangeLocatorString(name)) {
      return transformRange(name, transformation)
    }
  }
  catch (error) {
    if (isLitsError(error)) {
      return `(throw "${error.shortMessage}")`
    }
    if (error instanceof Error) {
      return `(throw "${error.message}")`
    }
    return `(throw "Unknown error")`
  }
  return name
}
