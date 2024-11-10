export function matrixMap<T, U>(matrix: T[][], callback: (value: T, position: [number, number], matrix: T[][]) => U): U[][] {
  return matrix.map((row, rowIndex) => row.map((value, colIndex) => callback(value, [rowIndex, colIndex], matrix)))
}

export function matrixForEach<T>(matrix: T[][], callback: (value: T, position: [number, number], matrix: T[][]) => void): void {
  matrix.forEach((row, rowIndex) => row.forEach((value, colIndex) => callback(value, [rowIndex, colIndex], matrix)))
}
