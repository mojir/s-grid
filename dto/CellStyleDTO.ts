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

export class CellStyleDTO {
  public readonly fontSize?: StyleFontSize
  public readonly bold?: boolean
  public readonly italic?: boolean
  public readonly textDecoration?: StyleTextDecoration
  public readonly justify?: StyleJustify
  public readonly align?: StyleAlign

  constructor(style: CellStyleDTO) {
    this.fontSize = style.fontSize
    this.bold = style.bold
    this.italic = style.italic
    this.textDecoration = style.textDecoration
    this.justify = style.justify
    this.align = style.align
  }
}

export type CellStyleName = keyof CellStyleDTO
