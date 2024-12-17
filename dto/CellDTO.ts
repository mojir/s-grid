import type { ColorDTO } from './ColorDTO'

export type StyleJustify = 'left' | 'center' | 'right' | 'auto'
export type StyleAlign = 'top' | 'middle' | 'bottom' | 'auto'
export type StyleTextDecoration = 'underline' | 'line-through' | 'none'
export const styleFontSizes = [
  12,
  14,
  16,
  18,
  24,
  36,
  48,
  60,
  72,
  96,
] as const

export type StyleFontSize = typeof styleFontSizes[number]

export function isFontSize(value: number): value is StyleFontSize {
  return styleFontSizes.includes(value as StyleFontSize)
}

export function isStyleJustify(value: string): value is StyleJustify {
  return ['left', 'center', 'right', 'auto'].includes(value)
}

export function isStyleAlign(value: string): value is StyleAlign {
  return ['top', 'middle', 'bottom', 'auto'].includes(value)
}

export function isStyleTextDecoration(value: string): value is StyleTextDecoration {
  return ['underline', 'line-through', 'none'].includes(value)
}

export type CellDTO = {
  input?: string
  formatter?: string
  fontSize?: StyleFontSize
  bold?: boolean
  italic?: boolean
  textDecoration?: StyleTextDecoration
  justify?: StyleJustify
  align?: StyleAlign
  backgroundColor?: ColorDTO
  textColor?: ColorDTO
}
