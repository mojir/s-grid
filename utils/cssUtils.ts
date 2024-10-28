export function whs(w: number, h: number) {
  return {
    width: `${w}px`,
    minWidth: `${w}px`,
    maxWidth: `${w}px`,
    height: `${h}px`,
    minHeight: `${h}px`,
    maxHeight: `${h}px`,
  }
}
export function ws(w: number) {
  return {
    width: `${w}px`,
    minWidth: `${w}px`,
    maxWidth: `${w}px`,
  }
}
export function hs(h: number) {
  return {
    height: `${h}px`,
    minHeight: `${h}px`,
    maxHeight: `${h}px`,
  }
}
