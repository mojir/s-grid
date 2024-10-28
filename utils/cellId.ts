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
  const [start, end] = range.split('-')
  const [startRow, startCol] = fromIdToCoords(start)
  const [endRow, endCol] = fromIdToCoords(end)
  return [startRow, startCol, endRow, endCol]
}

export function clampSelection(selection: string, range: string): string {
  const [start, end] = selection.split('-')

  if (!end) {
    return clampId(start, range)
  }

  const clampedStart = clampId(start, range)
  const clampedEnd = clampId(end, range)

  if (clampedStart === clampedEnd) {
    return clampedStart
  }

  return `${clampedStart}-${clampedEnd}`
}

export function sortSelection(selection: string): string {
  const [start, end] = selection.split('-')
  if (!end) {
    return start
  }

  const [startRowIndex, startColIndex] = fromIdToCoords(start)
  const [endRowIndex, endColIndex] = fromIdToCoords(end)

  const sortedStartRowIndex = Math.min(startRowIndex, endRowIndex)
  const sortedEndRowIndex = Math.max(startRowIndex, endRowIndex)
  const sortedStartColIndex = Math.min(startColIndex, endColIndex)
  const sortedEndColIndex = Math.max(startColIndex, endColIndex)

  return `${fromCoordsToId(sortedStartRowIndex, sortedStartColIndex)}-${fromCoordsToId(sortedEndRowIndex, sortedEndColIndex)}`
}

export function insideSelection(selection: string, id: string): boolean {
  const [start, end] = selection.split('-')
  if (end) {
    const [row, col] = fromIdToCoords(id)
    const [startRow, startCol] = fromIdToCoords(start)
    const [endRow, endCol] = fromIdToCoords(end)
    return row >= startRow && row <= endRow && col >= startCol && col <= endCol
  }
  return start === id
}

export function getSelectionFromId(selection: string): string {
  return selection.split('-')[0]
}

export function getSelectionToId(selection: string): string {
  const [first, last] = selection.split('-')
  return last ?? first
}

export function isCellId(id: unknown): id is string {
  return /^[A-Z]+\d+$/.test(id as string)
}

export function isRange(id: unknown): id is string {
  return /^[A-Z]+\d+-[A-Z]+\d+$/.test(id as string)
}

export function getCellIdsInRange(range: string): string[] {
  const [startRow, startCol, endRow, endCol] = fromRangeToCoords(range)

  const cellIds: string[] = []
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      cellIds.push(fromCoordsToId(row, col))
    }
  }
  return cellIds
}

type StructuredSelection = {
  matrix?: never
  flat: string[]
} | {
  matrix: string[][]
  flat?: never
}
export function getStructuredCellIdsInRange(range: string): StructuredSelection {
  const [startRow, startCol, endRow, endCol] = fromRangeToCoords(range)

  if (startRow === endRow) {
    const cellIds: string[] = []
    for (let col = startCol; col <= endCol; col++) {
      cellIds.push(fromCoordsToId(startRow, col))
    }
    return { flat: cellIds }
  }

  if (startCol === endCol) {
    const cellIds: string[] = []
    for (let row = startRow; row <= endRow; row++) {
      cellIds.push(fromCoordsToId(row, startCol))
    }
    return { flat: cellIds }
  }

  const cellIds: string[][] = []
  for (let row = startRow; row <= endRow; row++) {
    const rowIds: string[] = []
    cellIds.push(rowIds)
    for (let col = startCol; col <= endCol; col++) {
      rowIds.push(fromCoordsToId(row, col))
    }
  }
  return { matrix: cellIds }
}

export function cellBelow(id: string, range: string): string {
  const [row, col] = fromIdToCoords(id)
  const [startRow, startCol, endRow, endCol] = fromRangeToCoords(range)
  let nextRow = row + 1
  let nextCol = col
  if (nextRow > endRow) {
    nextRow = startRow
    nextCol += 1
    if (nextCol > endCol) {
      nextCol = startCol
    }
  }
  return fromCoordsToId(nextRow, nextCol)
}

export function cellAbove(id: string, range: string): string {
  const [row, col] = fromIdToCoords(id)
  const [startRow, startCol, endRow, endCol] = fromRangeToCoords(range)
  let nextRow = row - 1
  let nextCol = col
  if (nextRow < startRow) {
    nextRow = endRow
    nextCol -= 1
    if (nextCol < startCol) {
      nextCol = endCol
    }
  }
  return fromCoordsToId(nextRow, nextCol)
}

export function cellRight(id: string, range: string): string {
  const [row, col] = fromIdToCoords(id)
  const [startRow, startCol, endRow, endCol] = fromRangeToCoords(range)
  let nextRow = row
  let nextCol = col + 1
  if (nextCol > endCol) {
    nextCol = startCol
    nextRow += 1
    if (nextRow > endRow) {
      nextRow = startRow
    }
  }
  return fromCoordsToId(nextRow, nextCol)
}

export function cellLeft(id: string, range: string): string {
  const [row, col] = fromIdToCoords(id)
  const [startRow, startCol, endRow, endCol] = fromRangeToCoords(range)
  let nextRow = row
  let nextCol = col - 1
  if (nextCol < startCol) {
    nextCol = endCol
    nextRow -= 1
    if (nextRow < startRow) {
      nextRow = endRow
    }
  }
  return fromCoordsToId(nextRow, nextCol)
}
