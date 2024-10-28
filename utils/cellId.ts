export function getColIdFromIndex(colIndex: number) {
  let result = ''
  while (colIndex >= 0) {
    result = String.fromCharCode((colIndex % 26) + 65) + result
    colIndex = Math.floor(colIndex / 26) - 1
  }
  return result
}
export function getColIndex(colId: string) {
  return colId.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0)
}

export function fromCoordsToId(rowIndex: number, colIndex: number) {
  rowIndex = Math.max(0, rowIndex)
  colIndex = Math.max(0, colIndex)
  return `${getColIdFromIndex(colIndex)}${rowIndex + 1}`
}
export function fromIdToCoords(id: string): [number, number] {
  const match = id.match(/([A-Z]+)([0-9]+)/)
  if (!match) {
    throw new Error('Invalid cell id')
  }
  const [, colId, rowId] = match
  return [Number(rowId) - 1, getColIndex(colId)]
}

export function clampId(id: string, range: string): string {
  const [row, col] = fromIdToCoords(id)
  const [startRow, startCol, endRow, endCol] = fromRangeToCoords(range)
  const clampedRow = Math.max(startRow, Math.min(row, endRow))
  const clampedCol = Math.max(startCol, Math.min(col, endCol))
  return fromCoordsToId(clampedRow, clampedCol)
}

export function fromRangeToCoords(range: string): [number, number, number, number] {
  const [start, end] = range.split(':')
  const [startRow, startCol] = fromIdToCoords(start)
  const [endRow, endCol] = fromIdToCoords(end)
  return [startRow, startCol, endRow, endCol]
}

export function clampSelection(selection: string, range: string): string {
  const [start, end] = selection.split(':')

  if (!end) {
    return clampId(start, range)
  }

  const clampedStart = clampId(start, range)
  const clampedEnd = clampId(end, range)

  if (clampedStart === clampedEnd) {
    return clampedStart
  }

  return `${clampedStart}:${clampedEnd}`
}

export function sortSelection(selection: string): string {
  const [start, end] = selection.split(':')
  if (!end) {
    return start
  }

  const [startRowIndex, startColIndex] = fromIdToCoords(start)
  const [endRowIndex, endColIndex] = fromIdToCoords(end)

  const sortedStartRowIndex = Math.min(startRowIndex, endRowIndex)
  const sortedEndRowIndex = Math.max(startRowIndex, endRowIndex)
  const sortedStartColIndex = Math.min(startColIndex, endColIndex)
  const sortedEndColIndex = Math.max(startColIndex, endColIndex)

  return `${fromCoordsToId(sortedStartRowIndex, sortedStartColIndex)}:${fromCoordsToId(sortedEndRowIndex, sortedEndColIndex)}`
}

export function insideSelection(selection: string, id: string): boolean {
  const [start, end] = selection.split(':')
  if (end) {
    const [row, col] = fromIdToCoords(id)
    const [startRow, startCol] = fromIdToCoords(start)
    const [endRow, endCol] = fromIdToCoords(end)
    return row >= startRow && row <= endRow && col >= startCol && col <= endCol
  }
  return start === id
}

export function getSelectionFromId(selection: string): string {
  return selection.split(':')[0]
}

export function getSelectionToId(selection: string): string {
  const [first, last] = selection.split(':')
  return last ?? first
}

export function isCellId(id: unknown): id is string {
  return /^[A-Z]+\d+$/.test(id as string)
}
