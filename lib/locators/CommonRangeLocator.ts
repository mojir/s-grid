import { CommonLocator } from './CommonLocator'

export abstract class CommonRangeLocator extends CommonLocator {
  readonly abstract nbrOfRows: number
  readonly abstract nbrOfCols: number
  readonly abstract size: ComputedRef<number>
}
