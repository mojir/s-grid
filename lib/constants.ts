import type { StyleFontSize } from './CellStyle'

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
