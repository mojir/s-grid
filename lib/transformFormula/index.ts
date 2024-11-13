import { isLitsError } from '@mojir/lits'
import { CellId, type Movement } from '../CellId'
import { CellRange } from '../CellRange'
import type { RowRange } from '../Row'
import { transformCell } from './cellTransformers'
import { transformRange } from './rangeTransformers'

export type FormulaTransformation = {
  type: 'move'
  movement: Movement
} | {
  type: 'rowDelete'
  rowRange: RowRange
}

export function transformFormula(program: string, transformation: FormulaTransformation): string {
  const lits = useLits().value
  const tokenStream = lits.tokenize(program)
  const transformedTokenStream = lits.transform(tokenStream, name => transformName(name, transformation))
  return lits.untokenize(transformedTokenStream)
}

function transformName(name: string, transformation: FormulaTransformation): string {
  try {
    if (CellId.isCellIdString(name)) {
      return transformCell(name, transformation)
    }
    else if (CellRange.isCellRangeString(name)) {
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
