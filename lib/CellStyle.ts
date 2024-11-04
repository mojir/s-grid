export type StyleJustify = 'left' | 'center' | 'right'
export type StyleAlign = 'top' | 'middle' | 'bottom'
export type StyleTextDecoration = 'underline' | 'line-through'
export const styleFontSizes = [
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  14,
  18,
  24,
  36,
  48,
  60,
  72,
  96,
] as const

export type StyleFontSize = typeof styleFontSizes[number]

export const defaultFontSize: StyleFontSize = 14
export const defaultLineHeight = getLineHeight(defaultFontSize)

export type CellStyleName = keyof Omit<CellStyle, 'getJson'>
export class CellStyle {
  public fontSize: StyleFontSize | undefined = defaultFontSize
  public bold: boolean | undefined = undefined
  public italic: boolean | undefined = undefined
  public textDecoration: StyleTextDecoration | undefined = undefined
  public justify: StyleJustify | undefined = undefined
  public align: StyleAlign | undefined = undefined

  public getJson() {
    return {
      fontSize: this.fontSize,
      bold: this.bold,
      italic: this.italic,
      textDecoration: this.textDecoration,
      justify: this.justify,
      align: this.align,
    }
  }
}

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
