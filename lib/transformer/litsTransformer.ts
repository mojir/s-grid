import { isLitsError } from '@mojir/lits'
import { isRangeReferenceString } from '../reference/RangeReference'
import { getReferenceFromString } from '../reference/utils'
import { isCellReferenceString } from '../reference/CellReference'
import type { Cell } from '../Cell'
import type { Grid } from '../grid/Grid'
import { transformReference } from './referenceTransformer'
import type { Transformation } from '.'

let paused = false

export function pauseLitsTransformer() {
  paused = true
}

export function resumeLitsTransformer() {
  paused = false
}

export function transformLitsPrograms({
  cell,
  transformation,
}: {
  cell: Cell
  transformation: Transformation
}): void {
  if (paused) {
    return
  }
  const formula = cell.formula.value
  if (!formula) {
    return
  }
  const lits = useLits()
  const unresolvedIdentifiers = lits.getUnresolvedIdentifers(formula)

  const tokenStream = lits.tokenize(formula)
  const transformedTokenStream = lits.transform(
    tokenStream,
    (identifier) => {
      if (!unresolvedIdentifiers.has(identifier)) {
        return identifier
      }
      return transformIdentifier({
        cellGrid: cell.grid,
        identifier,
        transformation,
      })
    },
  )
  cell.setFormula(lits.untokenize(transformedTokenStream))
}

function transformIdentifier({
  cellGrid,
  identifier,
  transformation,
}: {
  cellGrid: Grid
  identifier: string
  transformation: Transformation
}): string {
  if (transformation.type === 'renameIdentifier') {
    if (identifier === transformation.oldIdentifier) {
      return transformation.newIdentifier
    }
    return identifier
  }

  if (!isCellReferenceString(identifier) && !isRangeReferenceString(identifier)) {
    return identifier
  }

  if (transformation.type === 'gridDelete') {
    if (!identifier.includes('!')) {
      return identifier
    }
    const [gridName] = identifier.split('!')
    if (gridName === transformation.grid.name.value) {
      return `(throw "Grid \\"${gridName}\\" was deleted")`
    }
    return identifier
  }

  if (transformation.type === 'renameGrid') {
    if (!identifier.includes('!')) {
      return identifier
    }
    const [gridName, rest] = identifier.split('!')
    if (gridName !== transformation.grid.name.value) {
      return identifier
    }
    return `${transformation.newName}!${rest}`
  }

  const reference = getReferenceFromString(transformation.grid, identifier)
  if (!reference) {
    return identifier
  }

  try {
    return transformReference(reference, transformation).toStringForGrid(cellGrid)
  }
  catch (error) {
    if (isLitsError(error)) {
      return `(throw "${error.shortMessage}")`
    }
    if (error instanceof Error) {
      return `(throw "${error.message}")`
    }
    return '(throw "Unknown error")'
  }
}
