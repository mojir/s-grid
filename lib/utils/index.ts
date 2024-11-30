import { colLocatorRegExp, rowLocatorRegExp } from '../constants'

export { cn } from './cn'
export { hs, whs, ws } from './cssUtils'

export function getGridName(displayName: string): string {
  return displayName.replace(/\s+/g, '_')
}

export function getGridDisplayName(gridName: string): string {
  return gridName.replace(/_/g, ' ')
}

export function getRowId(rowIndex: number): string {
  if (rowIndex < 9999 && rowIndex >= 0) {
    return `${rowIndex + 1}` as string
  }
  throw new Error(`Row index ${rowIndex} is out of range`)
}

export function getRowNumber(rowLocator: string): number {
  const match = rowLocator.match(rowLocatorRegExp)
  if (!match) {
    throw new Error(`Invalid row string: ${rowLocator}`)
  }
  return Number(match[3]) - 1
}

export function getColId(col: number): string {
  if (col < 0 || col >= 26 * 26) {
    throw new Error(`Col ${col} is out of range`)
  }
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode((col % 26) + 65) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}

export function getColNumber(colLocator: string): number {
  const match = colLocator.match(colLocatorRegExp)
  if (!match) {
    throw new Error(`Invalid col string: ${colLocator}`)
  }

  return match[3].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0)
}
