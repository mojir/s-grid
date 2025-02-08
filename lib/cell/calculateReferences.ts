import type { Grid } from '../grid/Grid'
import { CellReference, isCellReferenceString } from '../reference/CellReference'
import { isRangeReferenceString, RangeReference } from '../reference/RangeReference'

export function calculateReferences({
  grid,
  directLitsDeps,
}:
{
  grid: Grid
  directLitsDeps: Ref<string[]>
}) {
  return directLitsDeps.value.flatMap((identifier) => {
    if (isCellReferenceString(identifier)) {
      return CellReference.fromString(grid, identifier)
    }
    if (isRangeReferenceString(identifier)) {
      return RangeReference.fromString(grid, identifier)
    }
    const aliasCell = grid.project.aliases.getReference(identifier)
    if (aliasCell) {
      return aliasCell.value
    }
    return []
  })
}
