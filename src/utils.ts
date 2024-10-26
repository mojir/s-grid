export const cssUtils = {
  wh: (w: number, h: number) => {
    return {
      width: `${w}px`,
      minWidth: `${w}px`,
      maxWidth: `${w}px`,
      height: `${h}px`,
      minHeight: `${h}px`,
      maxHeight: `${h}px`,
    }
  },
  w: (w: number) => {
    return {
      width: `${w}px`,
      minWidth: `${w}px`,
      maxWidth: `${w}px`,
    }
  },
  h: (h: number) => {
    return {
      height: `${h}px`,
      minHeight: `${h}px`,
      maxHeight: `${h}px`,
    }
  }
}
