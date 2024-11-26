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

export type FormulaTransformation = {
  sourceGrid: Grid
  type: 'move'
  range?: RangeLocator
  movement: Movement
} | {
  sourceGrid: Grid
  type: 'rowDelete'
  rowRangeLocator: RowRangeLocator
} | {
  sourceGrid: Grid
  type: 'colDelete'
  colRangeLocator: ColRangeLocator
} | {
  sourceGrid: Grid
  type: 'rowInsertBefore'
  rowRangeLocator: RowRangeLocator
} | {
  sourceGrid: Grid
  type: 'colInsertBefore'
  colRangeLocator: ColRangeLocator
}

export function transformLocators(grid: Grid, cell: Cell, transformation: FormulaTransformation): void {
  const formula = cell.formula.value
  if (!formula) {
    return
  }
  const lits = useLits().value
  const tokenStream = lits.tokenize(formula)
  const transformedTokenStream = lits.transform(
    tokenStream,
    identifier => transformIdentifier(grid, identifier, transformation),
  )
  cell.setFormula(lits.untokenize(transformedTokenStream))
}

function transformIdentifier(grid: Grid, identifier: string, transformation: FormulaTransformation): string {
  const locator = getLocatorFromString(identifier)
  if (!locator) {
    return identifier
  }
  if (locator.externalGrid && locator.externalGrid !== transformation.sourceGrid.name.value) {
    return identifier
  }
  if (!locator.externalGrid && transformation.sourceGrid !== grid) {
    return identifier
  }

  try {
    if (locator instanceof CellLocator) {
      return transformCellLocator({ grid, transformation, cellLocator: locator })
    }
    if (locator instanceof RangeLocator) {
      return transformRangeLocator({ grid, transformation, rangeLocator: locator })
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
