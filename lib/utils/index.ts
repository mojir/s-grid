import { colIdRegExp, maxNumberOfCols, maxNumberOfRows, rowIdRegExp, simpleCellReferenceRegExp } from '../constants'

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

export function getColId(colIndex: number): string {
  if (colIndex < 0 || colIndex >= maxNumberOfCols) {
    throw new Error(`Col ${colIndex} is out of range`)
  }
  let result = ''
  let index = colIndex
  while (index >= 0) {
    result = String.fromCharCode((index % 26) + 65) + result
    index = Math.floor(index / 26) - 1
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

export function getIdFromTarget(target: EventTarget | null, type: string): string | null {
  if (target instanceof HTMLElement || target instanceof SVGElement) {
    if (target.id && target.id.startsWith(`${type}|`)) {
      return target.id
    }
    return getIdFromTarget(target.parentElement, type)
  }
  return null
}

export function getRowIndexAndColIndexFromSimpleCellReference(simpleCellReference: string): { rowIndex: number, colIndex: number } {
  const match = simpleCellReferenceRegExp.exec(simpleCellReference)
  if (!match) {
    throw new Error(`Invalid simple cell reference: ${simpleCellReference}`)
  }
  const [, colId, rowId] = match
  if (!colId || !rowId) {
    throw new Error(`Invalid simple cell reference: ${simpleCellReference}`)
  }
  return { rowIndex: getRowIndex(rowId), colIndex: getColIndex(colId) }
}

export type Handle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w' | 'move'
export function isHandle(value: unknown): value is Handle {
  if (typeof value !== 'string') {
    return false
  }
  return ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w', 'move'].includes(value)
}
