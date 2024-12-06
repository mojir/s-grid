import type { Grid } from '../Grid'
import { CellLocator, isCellLocatorString } from './CellLocator'
import type { ColLocator } from './ColLocator'
import type { ColRangeLocator } from './ColRangeLocator'
import { isRangeLocatorString, RangeLocator } from './RangeLocator'
import type { RowLocator } from './RowLocator'
import type { RowRangeLocator } from './RowRangeLocator'

export type ReferenceLocator = CellLocator | RangeLocator
export type AnyLocator = ReferenceLocator | RowLocator | RowRangeLocator | ColLocator | ColRangeLocator

export function getReferenceLocatorFromString(grid: Grid, locatorString: string): ReferenceLocator | null {
  if (!locatorString) {
    return null
  }
  return isCellLocatorString(locatorString)
    ? CellLocator.fromString(grid.name.value, locatorString)
    : isRangeLocatorString(locatorString)
      ? RangeLocator.fromString(grid, locatorString)
      : null
}
