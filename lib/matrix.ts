export function matrixMap<T, U>(matrix: T[][], callback: (value: T, position: [number, number], matrix: T[][]) => U): U[][] {
  return matrix.map((row, rowIndex) => row.map((value, colIndex) => callback(value, [rowIndex, colIndex], matrix)))
}

export function matrixForEach<T>(matrix: T[][], callback: (value: T, position: [number, number], matrix: T[][]) => void): void {
  matrix.forEach((row, rowIndex) => row.forEach((value, colIndex) => callback(value, [rowIndex, colIndex], matrix)))
}

export function matrixFilter<T>(matrix: T[][], callback: (value: T, position: [number, number], matrix: T[][]) => boolean): T[] {
  if (matrix.length === 0 || matrix[0]!.length === 0) {
    return []
  }
  return matrix.flat().filter((value, index) => callback(value, [Math.floor(index / matrix[0]!.length), index % matrix[0]!.length], matrix))
}
