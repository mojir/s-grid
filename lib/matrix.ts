export type Matrix<T> = MatrixClass<T>

class MatrixClass<T> {
  private matrix: T[][]

  private constructor(matrix: T[][]) {
    this.matrix = matrix
  }

  public static from<T>(matrix: T[][]): MatrixClass<T> {
    if (!MatrixClass.isMatrixLike(matrix)) {
      throw new Error('Invalid matrix')
    }
    return new MatrixClass(matrix)
  }

  public static isMatrixLike<T>(matrixLike: T[][]): boolean {
    if (!Array.isArray(matrixLike) || matrixLike.length === 0 || matrixLike[0]!.length === 0) {
      return false
    }
    const nbrOfCols = matrixLike[0]!.length
    return matrixLike.every(row => Array.isArray(row) && row.length === nbrOfCols)
  }

  public get(row: number, col: number): T {
    if (row < 0 || row >= this.matrix.length || col < 0 || col >= this.matrix[0]!.length) {
      throw new Error('Index out of bounds')
    }
    return this.matrix[row]![col]!
  }

  unbox(): T[][] {
    return this.matrix
  }

  cols(): T[][] {
    return this.transpose().matrix
  }

  transpose(): MatrixClass<T> {
    return new MatrixClass<T>(this.matrix[0]!.map((_, colIndex) => this.matrix.map(row => row[colIndex]!)))
  }

  map<U>(callback: (value: T, position: [number, number], matrix: T[][]) => U): MatrixClass<U> {
    return new MatrixClass(
      this.matrix.map((row, rowIndex) =>
        row.map((value, colIndex) =>
          callback(value, [rowIndex, colIndex], this.matrix),
        ),
      ),
    )
  }

  forEach(callback: (value: T, position: [number, number], matrix: T[][]) => void): void {
    this.matrix.forEach((row, rowIndex) =>
      row.forEach((value, colIndex) =>
        callback(value, [rowIndex, colIndex], this.matrix),
      ),
    )
  }

  filterNumbers(): MatrixClass<number | null> {
    return this.map((value) => {
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value
      }
      return null
    })
  }
}

export function matrix<T>(matrix: T[][]): MatrixClass<T> {
  return MatrixClass.from(matrix)
}

export function isMatrixShaped(matrixLike: unknown): matrixLike is unknown[][] {
  if (!Array.isArray(matrixLike) || matrixLike.length === 0) {
    return false
  }
  if (!Array.isArray(matrixLike[0]) || matrixLike[0]!.length === 0) {
    return false
  }

  const nbrOfCols = matrixLike[0]!.length
  return matrixLike.slice(1).every(row => Array.isArray(row) && row.length === nbrOfCols)
}

// export function matrixMap<T, U>(matrix: T[][], callback: (value: T, position: [number, number], matrix: T[][]) => U): U[][] {
//   return matrix.map((row, rowIndex) => row.map((value, colIndex) => callback(value, [rowIndex, colIndex], matrix)))
// }

// export function matrixForEach<T>(matrix: T[][], callback: (value: T, position: [number, number], matrix: T[][]) => void): void {
//   matrix.forEach((row, rowIndex) => row.forEach((value, colIndex) => callback(value, [rowIndex, colIndex], matrix)))
// }
