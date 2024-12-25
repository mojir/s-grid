import { colIdRegExp, maxNumberOfCols, maxNumberOfRows, rowIdRegExp } from '../constants'

export { cn } from './cn'
export { hs, whs, ws } from './cssUtils'

export function getGridName(displayName: string): string {
  return displayName.trim().replace(/\s+/g, '_')
}

export function getGridDisplayName(gridName: string): string {
  return gridName.replace(/_/g, ' ')
}

export function getRowId(rowIndex: number): string {
  if (rowIndex < 0 || rowIndex >= maxNumberOfRows) {
    throw new Error(`Row index ${rowIndex} is out of range`)
  }
  return `${rowIndex + 1}` as string
}

export function getRowIndex(rowId: string): number {
  if (!rowIdRegExp.test(rowId)) {
    throw new Error(`Invalid row id: ${rowId}`)
  }
  return Number(rowId) - 1
}

export function getColId(col: number): string {
  if (col < 0 || col >= maxNumberOfCols) {
    throw new Error(`Col ${col} is out of range`)
  }
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode((col % 26) + 65) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}

export function getColIndex(colId: string): number {
  if (!colIdRegExp.test(colId)) {
    throw new Error(`Invalid col id: ${colId}`)
  }
  if (colId.length === 1) {
    return colId.charCodeAt(0) - 65
  }
  return colId.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0) + 26
}
