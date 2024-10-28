export function wh(w: number, h: number) {
  return {
    width: `${w}px`,
    minWidth: `${w}px`,
    maxWidth: `${w}px`,
    height: `${h}px`,
    minHeight: `${h}px`,
    maxHeight: `${h}px`,
  }
}
export function w(w: number) {
  return {
    width: `${w}px`,
    minWidth: `${w}px`,
    maxWidth: `${w}px`,
  }
}
export function h(h: number) {
  return {
    height: `${h}px`,
    minHeight: `${h}px`,
    maxHeight: `${h}px`,
  }
}



