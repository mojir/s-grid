import { nameCharacterClass } from '@mojir/lits'
import type { StyleFontSize } from '~/dto/CellStyleDTO'

const colPart = '(\\$?)([A-Z]{1,2})' // Two groups
const rowPart = '(\\$?)([1-9]\\d{0,3})' // Two groups
const cellPart = `${colPart}${rowPart}` // Four groups
const gridPart = `(?:(?<grid>${nameCharacterClass}+)!)?` // One group
const rangeStart = `(?<colStart>${colPart})|(?<rowStart>${rowPart})|(?<cellStart>${colPart}${rowPart})`
const rangeEnd = `(?<colEnd>${colPart})|(?<rowEnd>${rowPart})|(?<cellEnd>${colPart}${rowPart})`

export const defaultNumberOfRows = 99
export const defaultNumberOfCols = 26
export const cellLocatorRegExp = new RegExp(`^${gridPart}${cellPart}$`)
export const rowLocatorRegExp = new RegExp(`^${gridPart}${rowPart}$`)
export const colLocatorRegExp = new RegExp(`^${gridPart}${colPart}$`)
export const rowRangeLocatorRegExp = new RegExp(`^${gridPart}(?<start>${rowPart})-(?<end>${rowPart})$`)
export const colRangeLocatorRegExp = new RegExp(`^${gridPart}(?<start>${colPart})-(?<end>${colPart})$`)
export const rangeLocatorRegExp = new RegExp(`^${gridPart}(?:${rangeStart})-(?:${rangeEnd})$`)

export const defaultFormatter = '#(format ".4~f" %)'
export const defaultFontSize: StyleFontSize = 14
export const defaultLineHeight = getLineHeight(defaultFontSize)
export const rowHeaderWidth = 50
export const colHeaderHeight = 25
export const minColHeight = 10
export const minRowWidth = 10
export const defaultColWidth = 120
export const defaultRowHeight = defaultLineHeight

export function getLineHeight(fontSize?: StyleFontSize): number {
  if (fontSize === undefined) {
    return defaultLineHeight
  }
  if (fontSize <= 10) {
    return fontSize * 1.2
  }
  if (fontSize <= 12) {
    return fontSize * 1.4
  }
  if (fontSize <= 18) {
    return fontSize * 1.6
  }
  return fontSize * 1.8
}
