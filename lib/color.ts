type Tripple = [number, number, number]

const hexRegExp = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i

export class Color {
  private constructor(
    public readonly colorMode: string,
    public readonly hue: number,
    public readonly saturation: number,
    public readonly lightness: number,
    public readonly alpha: number,
  ) {
  //   this.styleString = computed(() => {
  //     const actualLightness = colorMode.value === this.colorMode
  //       ? this.lightness
  //       : this.lightness > 50 ? 100 - this.lightness : 100 - this.lightness
  //     return `hsla(${hue}, ${saturation}%, ${actualLightness}%, ${alpha})`
  //   })
  }

  public static fromHex(colorMode: string, hex: string): Color {
    if (!hexRegExp.test(hex)) {
      console.error('Invalid hex color', hex)
      return new Color(colorMode, 0, 0, 0, 0)
    }
    const a = (hex.length === 7) ? 1 : parseInt(hex.slice(7, 9), 16) / 255
    return new Color(colorMode, ...rgbToHsl(...hexToRgb(hex)), a)
  }

  public static fromHsl(colorMode: string, h: number, s: number, l: number, a?: number): Color {
    a ??= 1
    if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100 || a < 0 || a > 1) {
      console.error('Invalid HSL color', h, s, l, a)
      return new Color(colorMode, 0, 0, 0, 0)
    }
    return new Color(colorMode, h, s, l, a)
  }

  public static fromRgb(colorMode: string, r: number, g: number, b: number, a?: number): Color {
    a ??= 1
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
      console.error('Invalid RGB color', r, g, b, a)
      return new Color(colorMode, 0, 0, 0, 0)
    }
    return new Color(colorMode, ...rgbToHsl(r, g, b), a)
  }

  public getHex(): string {
    return rgbToHex(...hslToRgb(this.hue, this.saturation, this.lightness))
  }

  public getJson() {
    return {
      colorMode: this.colorMode,
      hue: this.hue,
      saturation: this.saturation,
      lightness: this.lightness,
      alpha: this.alpha,
    }
  }

  toggleLightness(): Color {
    const newL = this.lightness > 50 ? 100 - this.lightness : 100 - this.lightness
    return new Color(this.colorMode, this.hue, this.saturation, newL, this.alpha)
  }
}

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
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
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
