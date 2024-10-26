export const cssUtils = {
  dim: (w: number | null, h: number | null) => {
    const result: Record<string, string> = {}
    if (w !== null) {
      result.width = `${w}px`
      result.minWidth = `${w}px`
    }
    if (h !== null) {
      result.height = `${h}px`
      result.minHeight = `${h}px`
    }
    return result
  }
}
