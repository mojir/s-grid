import { isLitsError } from '@mojir/lits'
import { RangeLocator } from '../locators/RangeLocator'
import { getReferenceLocatorFromString, type Movement } from '../locators/utils'
import type { RowRangeLocator } from '../locators/RowRangeLocator'
import { CellLocator } from '../locators/CellLocator'
import type { ColRangeLocator } from '../locators/ColRangeLocator'
import type { Cell } from '../Cell'
import type { Grid } from '../grid/Grid'
import { transformRangeLocator } from '../transformLocators/rangeTransformers'
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
    identifier => transformIdentifier(cell.grid, identifier, transformation),
  )
  cell.setFormula(lits.untokenize(transformedTokenStream))
}

function transformIdentifier(cellGrid: Grid, identifier: string, transformation: FormulaTransformation): string {
  const locator = getReferenceLocatorFromString(transformation.sourceGrid, identifier)
  if (!locator) {
    return identifier
  }

  try {
    if (locator instanceof CellLocator) {
      return transformCellLocator({ cellGrid, transformation, cellLocator: locator })
    }
    if (locator instanceof RangeLocator) {
      return transformRangeLocator({ cellGrid, transformation, rangeLocator: locator })
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
