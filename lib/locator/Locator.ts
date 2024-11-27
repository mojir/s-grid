import { CellLocator, isCellLocatorString } from './CellLocator'
import { ColLocator, isColLocatorString } from './ColLocator'
import { ColRangeLocator, isColRangeLocatorString } from './ColRangeLocator'
import { isRangeLocatorString, RangeLocator } from './RangeLocator'
import type { RowLocator } from './RowLocator'
import { isRowRangeLocatorString, RowRangeLocator } from './RowRangeLocator'

export type Locator = CellLocator | RowLocator | ColLocator | RangeLocator | RowRangeLocator | ColRangeLocator

export function getLocatorFromString(gridName: string, locatorString: string): Locator | null {
  if (!locatorString) {
    return null
  }
  return isRangeLocatorString(locatorString)
    ? RangeLocator.fromString(gridName, locatorString)
    : isColLocatorString(locatorString)
      ? ColLocator.fromString(gridName, locatorString)
      : isCellLocatorString(locatorString)
        ? CellLocator.fromString(gridName, locatorString)
        : isCellLocatorString(locatorString)
          ? CellLocator.fromString(gridName, locatorString)
          : isRowRangeLocatorString(locatorString)
            ? RowRangeLocator.fromString(gridName, locatorString)
            : isColRangeLocatorString(locatorString)
              ? ColRangeLocator.fromString(gridName, locatorString)
              : null
}
