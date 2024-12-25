import { isLitsError } from '@mojir/lits'
import { isRangeReferenceString, RangeReference } from '../reference/RangeReference'
import { getReferenceFromString, type Movement } from '../reference/utils'
import { CellReference, isCellReferenceString } from '../reference/CellReference'
import type { Cell } from '../Cell'
import type { Grid } from '../grid/Grid'
import { transformRangeReference } from './rangeTransformers'
import { transformCellReference } from './cellReferenceTransformer'

export type RenameGridTransformation = {
  type: 'renameGrid'
  newName: string
  sourceGrid: Grid
}

export type MoveTransformation = {
  sourceGrid: Grid
  type: 'move'
  range?: RangeReference
  movement: Movement
}

export type GridDeleteTransformation = {
  sourceGrid: Grid
  type: 'gridDelete'
}

export type RowDeleteTransformation = {
  sourceGrid: Grid
  type: 'rowDelete'
  row: number
  count: number
}

export type ColDeleteTransformation = {
  sourceGrid: Grid
  type: 'colDelete'
  col: number
  count: number
}

export type RowInsertBeforeTransformation = {
  sourceGrid: Grid
  type: 'rowInsertBefore'
  row: number
  count: number
}

export type ColInsertBeforeTransformation = {
  sourceGrid: Grid
  type: 'colInsertBefore'
  col: number
  count: number
}

export type FormulaTransformation = GridDeleteTransformation | RenameGridTransformation | MoveTransformation | RowDeleteTransformation | ColDeleteTransformation | RowInsertBeforeTransformation | ColInsertBeforeTransformation

export function transformReferences(cell: Cell, transformation: FormulaTransformation): void {
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
  if (!isCellReferenceString(identifier) && !isRangeReferenceString(identifier)) {
    return identifier
  }

  if (transformation.type === 'gridDelete') {
    if (!identifier.includes('!')) {
      return identifier
    }
    const [gridName] = identifier.split('!')
    if (gridName === transformation.sourceGrid.name.value) {
      return `(throw "Grid \\"${gridName}\\" was deleted")`
    }
    return identifier
  }

  if (transformation.type === 'renameGrid') {
    if (!identifier.includes('!')) {
      return identifier
    }
    const [gridName, rest] = identifier.split('!')
    if (gridName !== transformation.sourceGrid.name.value) {
      return identifier
    }
    return `${transformation.newName}!${rest}`
  }

  const reference = getReferenceFromString(transformation.sourceGrid, identifier)
  if (!reference) {
    return identifier
  }

  try {
    if (reference instanceof CellReference) {
      return transformCellReference({ cellGrid, transformation, cellReference: reference })
    }
    if (reference instanceof RangeReference) {
      return transformRangeReference({ cellGrid: cellGrid, transformation, rangeReference: reference })
    }
    throw new Error(`Unsupported reference type: ${identifier}`)
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
