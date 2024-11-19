import { defaultFontSize } from './constants'

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

export type CellStyleName = keyof Omit<CellStyle, 'getJson'>

export type CellStyleJson = {
  fontSize?: StyleFontSize
  bold?: boolean
  italic?: boolean
  textDecoration?: StyleTextDecoration
  justify?: StyleJustify
  align?: StyleAlign
}
export class CellStyle {
  public fontSize: StyleFontSize | undefined = defaultFontSize
  public bold: boolean | undefined = undefined
  public italic: boolean | undefined = undefined
  public textDecoration: StyleTextDecoration | undefined = undefined
  public justify: StyleJustify | undefined = undefined
  public align: StyleAlign | undefined = undefined

  public static fromJson(json: CellStyleJson): CellStyle {
    const style = new CellStyle()
    style.fontSize = json.fontSize
    style.bold = json.bold
    style.italic = json.italic
    style.textDecoration = json.textDecoration
    style.justify = json.justify
    style.align = json.align
    return style
  }

  public getJson(): CellStyleJson {
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

export function validCellStyle(property: CellStyleName, value: unknown): boolean {
  switch (property) {
    case 'bold':
      return typeof value === 'boolean'
    case 'italic':
      return typeof value === 'boolean'
    case 'textDecoration':
      return ['underline', 'line-through'].includes(value as string)
    case 'justify':
      return ['left', 'center', 'right'].includes(value as string)
    case 'align':
      return ['top', 'middle', 'bottom'].includes(value as string)
    case 'fontSize':
      return styleFontSizes.includes(value as StyleFontSize)
  }
}
