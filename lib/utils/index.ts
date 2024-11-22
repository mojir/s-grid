import type { CellLocator } from '../locator/CellLocator'
import type { RangeLocator } from '../locator/RangeLocator'

export { cn } from './cn'
export { hs, whs, ws } from './cssUtils'
export { defaultFormatter } from './defaultFormatter'

export type CellOrRangeTarget = string | CellLocator | RangeLocator
export type CellTarget = string | CellLocator

