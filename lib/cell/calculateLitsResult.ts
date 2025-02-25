import type { Grid } from '../grid/Grid'
import type { Result } from './cellTypes'

export function calculateLitsResult({
  run,
  grid,
  formula,
  allLitsDeps,
}:
{
  run: RunLits
  grid: Grid
  formula: Ref<string | undefined>
  allLitsDeps: Ref<string[]>
}): Result {
  if (formula.value === undefined) {
    return {}
  }

  try {
    const values = grid.project.getValuesFromUndefinedIdentifiers(allLitsDeps.value, grid)
    const result = run(formula.value, { values })
    return { result }
  }
  catch (error) {
    return { error: error instanceof Error ? error : new Error('Unknown error') }
  }
}
