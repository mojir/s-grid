export const cssUtils = {
  wh: (w: number, h: number) => {
    return {
      width: `${w}px`,
      minWidth: `${w}px`,
      height: `${h}px`,
      minHeight: `${h}px`
    }
  },
  w: (w: number) => {
    return {
      width: `${w}px`,
      minWidth: `${w}px`
    }
  },
  h: (h: number) => {
    return {
      height: `${h}px`,
      minHeight: `${h}px`
    }
  }
}
