import { identifierCharacterClass, identifierFirstCharacterClass } from '@mojir/lits'
import type { StyleFontSize } from '~/dto/CellDTO'

const colPart = '(\\$?)([A-Z]{1,2})' // Two groups
const rowPart = '(\\$?)([1-9]\\d{0,3})' // Two groups
const cellPart = `${colPart}${rowPart}` // Four groups
const gridPart = `(?:(?<grid>${identifierFirstCharacterClass}${identifierCharacterClass}*)!)?` // One group
const rangeStart = `(?<colStart>${colPart})|(?<rowStart>${rowPart})|(?<cellStart>${colPart}${rowPart})`
const rangeEnd = `(?<colEnd>${colPart})|(?<rowEnd>${rowPart})|(?<cellEnd>${colPart}${rowPart})`

export const defaultNumberOfRows = 99
export const defaultNumberOfCols = 26
export const maxNumberOfRows = 9999
export const maxNumberOfCols = 26 * 27 // ZZ

export const colIdRegExp = /^[A-Z]{1,2}$/
export const rowIdRegExp = /^[1-9]\d{0,3}$/

export const cellReferenceRegExp = new RegExp(`^${gridPart}${cellPart}$`)
export const rangeRangeRegExp = new RegExp(`^${gridPart}(?:${rangeStart}):(?:${rangeEnd})$`)

export const pageSize = 40

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
