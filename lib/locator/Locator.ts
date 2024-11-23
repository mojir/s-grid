import { CellLocator, isCellLocatorString } from './CellLocator'
import { ColLocator, isColLocatorString } from './ColLocator'
import { ColRangeLocator, isColRangeLocatorString } from './ColRangeLocator'
import { isRangeLocatorString, RangeLocator } from './RangeLocator'
import type { RowLocator } from './RowLocator'
import { isRowRangeLocatorString, RowRangeLocator } from './RowRangeLocator'

export type Locator = CellLocator | RowLocator | ColLocator | RangeLocator | RowRangeLocator | ColRangeLocator

export function getLocatorFromString(locatorString?: string): Locator | null {
  if (!locatorString) {
    return null
  }
  return isRangeLocatorString(locatorString)
    ? RangeLocator.fromString(locatorString)
    : isColLocatorString(locatorString)
      ? ColLocator.fromString(locatorString)
      : isCellLocatorString(locatorString)
        ? CellLocator.fromString(locatorString)
        : isCellLocatorString(locatorString)
          ? CellLocator.fromString(locatorString)
          : isRowRangeLocatorString(locatorString)
            ? RowRangeLocator.fromString(locatorString)
            : isColRangeLocatorString(locatorString)
              ? ColRangeLocator.fromString(locatorString)
              : null
}
