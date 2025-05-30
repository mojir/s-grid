import type { CellType, StyleFontFamily, StyleFontSize } from '~/dto/CellDTO'

const allowedSymbolCharClass = '[^()\\[\\]{}\'"`,.; \\n\\r\\t]'
const allowedFirstSymbolCharClass = '[^0123456789()\\[\\]{}\'"`,.; \\n\\r\\t]'

const colPart = '(\\$?)([A-Z]{1,2})' // Two groups
const rowPart = '(\\$?)([1-9]\\d{0,3})' // Two groups
const cellPart = `${colPart}${rowPart}` // Four groups
const gridPart = `(?:(?<grid>${allowedFirstSymbolCharClass}${allowedSymbolCharClass}*)!)?` // One group
const rangeStart = `(?<colStart>${colPart})|(?<rowStart>${rowPart})|(?<cellStart>${colPart}${rowPart})`
const rangeEnd = `(?<colEnd>${colPart})|(?<rowEnd>${rowPart})|(?<cellEnd>${colPart}${rowPart})`

export const simpleCellReferenceRegExp = /^([A-Z]{1,2})([1-9]\d{0,3})$/
export const defaultNbrOfRows = 99
export const defaultNbrOfCols = 26
export const maxNbrOfRows = 9999
export const maxNbrOfCols = 26 * 27 // ZZ

export const colIdRegExp = /^[A-Z]{1,2}$/
export const rowIdRegExp = /^[1-9]\d{0,3}$/

export const cellReferenceRegExp = new RegExp(`^${gridPart}${cellPart}$`)
export const rangeRangeRegExp = new RegExp(`^${gridPart}(?:${rangeStart}):(?:${rangeEnd})$`)

export const pageSize = 40

export const defaultCellType: CellType = 'auto'
export const defaultNumberFormatter = '-> $ number:format ".4~f"'
export const defaultDatePattern = 'yyyy-MM-dd'
export const defaultDateFormatter = `-> $ date:format "${defaultDatePattern}"`
export const defaultFontSize: StyleFontSize = 14
export const defaultFontFamily: StyleFontFamily = 'sans-serif:Arial'
// TODO set defalultLineHeight to 14 * 1.6
//      move getLineHeight to utils
//      add test to verify that defalultLineHeight equals getLineHeight(14)
export const defaultLineHeight = getLineHeight(defaultFontSize)
export const rowHeaderWidth = 50
export const colHeaderHeight = 25
export const minColHeight = 16
export const minRowWidth = 48
export const defaultColWidth = 120
export const defaultRowHeight = defaultLineHeight

export function getLineHeight(fontSize?: StyleFontSize): number {
  if (fontSize === undefined) {
    return defaultLineHeight
  }
  return fontSize * 1.4
}
