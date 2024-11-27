import { isLitsError } from '@mojir/lits'
import { RangeLocator } from '../locator/RangeLocator'
import type { Movement } from '../locator/utils'
import type { RowRangeLocator } from '../locator/RowRangeLocator'
import { CellLocator } from '../locator/CellLocator'
import type { ColRangeLocator } from '../locator/ColRangeLocator'
import type { Grid } from '../Grid'
import type { Cell } from '../Cell'
import { getLocatorFromString } from '../locator/Locator'
import { transformRangeLocator } from './rangeTransformers'
import { transformCellLocator } from './cellTransformers'

export type MoveTransformation = {
  sourceGrid: Grid
  type: 'move'
  range?: RangeLocator
  movement: Movement
}

export type RowDeleteTransformation = {
  sourceGrid: Grid
  type: 'rowDelete'
  rowRangeLocator: RowRangeLocator
}

export type ColDeleteTransformation = {
  sourceGrid: Grid
  type: 'colDelete'
  colRangeLocator: ColRangeLocator
}

export type RowInsertBeforeTransformation = {
  sourceGrid: Grid
  type: 'rowInsertBefore'
  rowRangeLocator: RowRangeLocator
}

export type ColInsertBeforeTransformation = {
  sourceGrid: Grid
  type: 'colInsertBefore'
  colRangeLocator: ColRangeLocator
}

export type FormulaTransformation = MoveTransformation | RowDeleteTransformation | ColDeleteTransformation | RowInsertBeforeTransformation | ColInsertBeforeTransformation

export function transformLocators(cell: Cell, transformation: FormulaTransformation): void {
  const formula = cell.formula.value
  if (!formula) {
    return
  }
  const lits = useLits().value
  const tokenStream = lits.tokenize(formula)
  const transformedTokenStream = lits.transform(
    tokenStream,
    identifier => transformIdentifier(identifier, transformation),
  )
  cell.setFormula(lits.untokenize(transformedTokenStream))
}

function transformIdentifier(identifier: string, transformation: FormulaTransformation): string {
  const locator = getLocatorFromString(transformation.sourceGrid.name.value, identifier)
  if (!locator) {
    return identifier
  }

  try {
    if (locator instanceof CellLocator) {
      return transformCellLocator({ transformation, cellLocator: locator })
    }
    if (locator instanceof RangeLocator) {
      return transformRangeLocator({ transformation, rangeLocator: locator })
    }
    throw new Error(`Unsupported locator type: ${identifier}`)
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
}
