import type { CellId } from '../CellId'
import type { CellRange } from '../CellRange'

export { cn } from './cn'
export { hs, whs, ws } from './cssUtils'
export { defaultFormatter } from './defaultFormatter'

export type CellOrRangeTarget = string | CellId | CellRange
export type CellTarget = string | CellId
