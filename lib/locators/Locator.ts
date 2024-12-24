import type { Cell } from '../Cell'
import type { Grid } from '../grid/Grid'
import type { RangeLocator } from './RangeLocator'

export type Locator = {
  grid: Grid
  toString: (currentGrid: Grid) => string
  toStringWithoutGrid: () => string
  toStringWithGrid: () => string
  equals: (locator: Locator) => boolean
  toRangeLocator: () => RangeLocator
  getValue: () => unknown
  getCells: () => Cell[]
}
