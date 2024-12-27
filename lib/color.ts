/* eslint-disable no-param-reassign */
import type { ColorDTO } from '~/dto/ColorDTO'

type Tripple = [number, number, number]

const hexRegExp = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i

export class Color {
  private constructor(
    public readonly hue: number,
    public readonly saturation: number,
    public readonly lightness: number,
    public readonly alpha: number,
  ) {}

  getStyleString(): string {
    return `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`
  }

  public static fromHex(hex: string): Color {
    if (!hexRegExp.test(hex)) {
      console.error('Invalid hex color', hex)
      return new Color(0, 0, 0, 0)
    }
    const a = (hex.length === 7) ? 1 : parseInt(hex.slice(7, 9), 16) / 255
    return new Color(...rgbToHsl(...hexToRgb(hex)), a)
  }

  public static fromHsl(h: number, s: number, l: number, a?: number): Color {
    a ??= 1
    if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100 || a < 0 || a > 1) {
      console.error('Invalid HSL color', h, s, l, a)
      return new Color(0, 0, 0, 0)
    }
    return new Color(h, s, l, a)
  }

  public static fromRgb(r: number, g: number, b: number, a?: number): Color {
    a ??= 1
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
      console.error('Invalid RGB color', r, g, b, a)
      return new Color(0, 0, 0, 0)
    }
    return new Color(...rgbToHsl(r, g, b), a)
  }

  public static fromDTO(dto: ColorDTO): Color {
    return new Color(dto.hue, dto.saturation, dto.lightness, dto.alpha)
  }

  public withAlpha(alpha: number): Color {
    return new Color(this.hue, this.saturation, this.lightness, alpha)
  }

  public getHex(): string {
    return rgbToHex(...hslToRgb(this.hue, this.saturation, this.lightness))
  }

  public getDTO(): ColorDTO {
    return {
      hue: this.hue,
      saturation: this.saturation,
      lightness: this.lightness,
      alpha: this.alpha,
    }
  }

  toggleLightness(): Color {
    const newL = this.lightness > 50 ? 100 - this.lightness : 100 - this.lightness
    return new Color(this.hue, this.saturation, newL, this.alpha)
  }

  isDark(): boolean {
    return this.lightness < 50
  }

  equals(other: Color): boolean {
    return this.hue === other.hue && this.saturation === other.saturation && this.lightness === other.lightness && this.alpha === other.alpha
  }
}

export const colorPalette = [
  // Row 1: Grayscale
  ['#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#ffffff'].map(color => Color.fromHex(color)),

  // Row 2: Reds
  ['#330000', '#660000', '#990000', '#cc0000', '#ff0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc', '#fff2f2'].map(color => Color.fromHex(color)),

  // Row 3: Oranges
  ['#331900', '#663300', '#994c00', '#cc6600', '#ff8000', '#ff9933', '#ffb366', '#ffcc99', '#ffe6cc', '#fff5e6'].map(color => Color.fromHex(color)),

  // Row 4: Yellows
  ['#333300', '#666600', '#999900', '#cccc00', '#ffff00', '#ffff33', '#ffff66', '#ffff99', '#ffffcc', '#fffff2'].map(color => Color.fromHex(color)),

  // Row 5: Greens
  ['#003300', '#006600', '#009900', '#00cc00', '#00ff00', '#33ff33', '#66ff66', '#99ff99', '#ccffcc', '#f2fff2'].map(color => Color.fromHex(color)),

  // Row 6: Teals
  ['#003333', '#006666', '#009999', '#00cccc', '#00ffff', '#33ffff', '#66ffff', '#99ffff', '#ccffff', '#f2ffff'].map(color => Color.fromHex(color)),

  // Row 7: Blues
  ['#000033', '#000066', '#000099', '#0000cc', '#0000ff', '#3333ff', '#6666ff', '#9999ff', '#ccccff', '#f2f2ff'].map(color => Color.fromHex(color)),

  // Row 8: Purples
  ['#330033', '#660066', '#990099', '#cc00cc', '#ff00ff', '#ff33ff', '#ff66ff', '#ff99ff', '#ffccff', '#fff2ff'].map(color => Color.fromHex(color)),

  // Row 9: Browns
  ['#291811', '#402e27', '#664c3f', '#806040', '#997950', '#b39060', '#cca670', '#e6bc80', '#ffd494', '#fff4e6'].map(color => Color.fromHex(color)),

  // Row 10: Muted colors
  ['#4a4a4a', '#6b6b47', '#4a754a', '#4a757c', '#4a4a75', '#754a75', '#754a4a', '#617c7c', '#7c617c', '#7c7c61'].map(color => Color.fromHex(color)),
]

function hexToRgb(hex: string): Tripple {
  const bigint = parseInt(hex.slice(1), 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function rgbToHsl(r: number, g: number, b: number): Tripple {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): Tripple {
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) {
      t += 1
    }
    if (t > 1) {
      t -= 1
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t
    }
    if (t < 1 / 2) {
      return q
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6
    }
    return p
  }

  let r, g, b

  if (s === 0) {
    r = g = b = l // achromatic
  }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h / 360 + 1 / 3)
    g = hue2rgb(p, q, h / 360)
    b = hue2rgb(p, q, h / 360 - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}
