import type { Grid } from '../grid/Grid'
import { CommonLocator } from './CommonLocator'

export abstract class CommonRangeLocator extends CommonLocator {
  readonly sorted: boolean
  readonly abstract nbrOfRows: number
  readonly abstract nbrOfCols: number
  readonly abstract size: ComputedRef<number>

  constructor(grid: Grid, sorted: boolean) {
    super(grid)
    this.sorted = sorted
  }

  abstract toSorted(): CommonRangeLocator
}
