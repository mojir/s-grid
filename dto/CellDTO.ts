import type { ColorDTO } from './ColorDTO'

export type StyleJustify = 'left' | 'center' | 'right' | 'auto'
export type StyleAlign = 'top' | 'middle' | 'bottom' | 'auto'
export type StyleTextDecoration = 'underline' | 'line-through' | 'none'
export const styleFontSizes = [
  10,
  11,
  12,
  13,
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

export type GenericFont = 'sans-serif' | 'serif' | 'monospace' | 'cursive'

export const fontFamilies: `${GenericFont}:${string}`[] = [
  'sans-serif:Arial',
  'sans-serif:Geneva',
  'sans-serif:Gill Sans',
  'sans-serif:Helvetica',
  'sans-serif:Lucida Grande',
  'sans-serif:Roboto',
  'sans-serif:Tahoma',
  'sans-serif:Trebuchet MS',
  'sans-serif:Verdana',
  'serif:Times New Roman',
  'serif:Georgia',
  'serif:Palatino',
  'serif:Baskerville',
  'serif:Didot',
  'monospace:Courier New',
  'monospace:Courier',
  'monospace:Monaco',
  'monospace:Andale Mono',
  'cursive:Comic Sans MS',
  'cursive:Impact',
  'cursive:Luminari',
  'cursive:Chalkduster',
  'cursive:Copperplate',
] as const

async function isSupported(fontName: string) {
  try {
    const font = new FontFace(fontName, `local(${fontName})`)
    await font.load()
    return true
  }
  catch {
    return false
  }
}
for (const fontFamily of fontFamilies) {
  if (!await isSupported(fontFamily.split(':')[1]!)) {
    console.warn(fontFamily.split(':')[1], 'is not supported')
  }
}
export type StyleFontFamily = typeof fontFamilies[number]

export function isFontFamily(value: string): value is StyleFontFamily {
  return fontFamilies.includes(value as StyleFontFamily)
}

export function toFontFamilyCss(fontFamily: StyleFontFamily) {
  const [generic, specific] = fontFamily.split(':') as [GenericFont, string]
  return `"${specific}", ${generic}`
}
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
  numberFormatter?: string
  fontSize?: StyleFontSize
  fontFamily?: StyleFontFamily
  bold?: boolean
  italic?: boolean
  textDecoration?: StyleTextDecoration
  justify?: StyleJustify
  align?: StyleAlign
  backgroundColor?: ColorDTO
  textColor?: ColorDTO
}
