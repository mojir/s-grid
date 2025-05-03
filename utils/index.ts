import { colIdRegExp, maxNbrOfCols, maxNbrOfRows, rowIdRegExp, simpleCellReferenceRegExp } from '../lib/constants'

export function getGridName(displayName: string): string {
  return displayName.trim().replace(/\s+/g, '_')
}

export function getGridDisplayName(gridName: string): string {
  return gridName.replace(/_/g, ' ')
}

export function getRowId(rowIndex: number): string {
  if (rowIndex < 0 || rowIndex >= maxNbrOfRows) {
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
  if (colIndex < 0 || colIndex >= maxNbrOfCols) {
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

export function jsToLits(js: unknown): string {
  if (js === null || js === undefined) {
    return 'null'
  }
  if (typeof js === 'string') {
    return `"${js}"`
  }
  if (typeof js === 'number') {
    return `${js}`
  }
  if (typeof js === 'boolean') {
    return js ? 'true' : 'false'
  }
  if (Array.isArray(js)) {
    return `[${js.map(jsToLits).join(' ')}]`
  }
  if (typeof js === 'object') {
    if (js instanceof Date) {
      return `"${js.toISOString()}"`
    }
    if (js instanceof Error) {
      return `"Error: ${js.message}"`
    }
    if (isPlainObject(js)) {
      return `{${Object.entries(js).map(([key, value]) => `"${key}" ${jsToLits(value)}`).join(' ')}}`
    }
    return `"${js.toString()}"` // Fallback
  }
  throw new Error(`Unsupported ${js}`)
}

export function isPrimitive(val: unknown): val is null | undefined | string | number | boolean {
  return val === null || (typeof val !== 'object' && typeof val !== 'function' && typeof val !== 'symbol')
}

export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj?.constructor === Object && Object.getPrototypeOf(obj) === Object.prototype
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function replaceInfinities(value: unknown): unknown {
  if (value === Number.POSITIVE_INFINITY) {
    return '∞'
  }
  if (value === Number.NEGATIVE_INFINITY) {
    return '-∞'
  }
  if (Array.isArray(value)) {
    return value.map(replaceInfinities)
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = replaceInfinities(val)
    }
    return result
  }
  return value
}
