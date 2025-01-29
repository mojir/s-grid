import { CellReference } from '../reference/CellReference'
import type { Reference } from '../reference/utils'
import { transformCellReference } from './cellReferenceTransformer'
import { transformRangeReference } from './rangeReferenceTransformer'
import type { ReferenceTransformation } from '.'

export function transformReference<T extends Reference>(reference: T, transformation: ReferenceTransformation): T {
  if (reference.grid !== transformation.grid) {
    return reference
  }
  if (reference instanceof CellReference) {
    return transformCellReference({ transformation, cellReference: reference }) as T
  }
  else {
    return transformRangeReference({ transformation, rangeReference: reference }) as T
  }
}
