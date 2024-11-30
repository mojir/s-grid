export type StyleJustify = 'left' | 'center' | 'right'
export type StyleAlign = 'top' | 'middle' | 'bottom'
export type StyleTextDecoration = 'underline' | 'line-through'
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

export type CellStyleDTO = {
  fontSize?: StyleFontSize
  bold?: boolean
  italic?: boolean
  textDecoration?: StyleTextDecoration
  justify?: StyleJustify
  align?: StyleAlign
}

export type CellStyleName = keyof CellStyleDTO
