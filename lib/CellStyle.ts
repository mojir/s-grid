import { defaultFontSize } from './constants'
import {
  type StyleFontSize,
  type StyleTextDecoration,
  type StyleJustify,
  type StyleAlign,
  type CellStyleDTO,
  type CellStyleName,
  styleFontSizes,
} from '~/dto/CellStyleDTO'

export class CellStyle {
  public fontSize: StyleFontSize | undefined = defaultFontSize
  public bold: boolean | undefined = undefined
  public italic: boolean | undefined = undefined
  public textDecoration: StyleTextDecoration | undefined = undefined
  public justify: StyleJustify | undefined = undefined
  public align: StyleAlign | undefined = undefined

  public static fromJson(json: CellStyleDTO): CellStyle {
    const style = new CellStyle()
    style.fontSize = json.fontSize
    style.bold = json.bold
    style.italic = json.italic
    style.textDecoration = json.textDecoration
    style.justify = json.justify
    style.align = json.align
    return style
  }

  public getJson(): CellStyleDTO {
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
