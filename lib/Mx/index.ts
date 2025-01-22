export class Mx<T> {
  private matrix: T[][]

  private constructor(matrix: T[][]) {
    this.matrix = matrix
  }

  public static from<T>(matrix: T[][]): Mx<T> {
    if (!isMxArray(matrix)) {
      throw new Error('Invalid matrix')
    }
    return new Mx(matrix)
  }

  public get(row: number, col: number): T {
    if (row < 0 || row >= this.matrix.length || col < 0 || col >= this.matrix[0]!.length) {
      throw new Error('Index out of bounds')
    }
    return this.matrix[row]![col]!
  }

  public set(row: number, col: number, value: T) {
    if (row < 0 || row >= this.matrix.length || col < 0 || col >= this.matrix[0]!.length) {
      throw new Error('Index out of bounds')
    }
    this.matrix[row]![col] = value
  }

  public insertRows(rowIndex: number, count = 1, getDefaultValue: (coords: { rowIndex: number, colIndex: number }) => T) {
    if (rowIndex < 0 || rowIndex > this.matrix.length) {
      throw new Error('Index out of bounds')
    }
    for (let i = 0; i < count; i += 1) {
      const newRow = Array.from({ length: this.matrix[0]!.length }, (_, colIndex) => getDefaultValue({ rowIndex: rowIndex + i, colIndex }))
      this.matrix.splice(rowIndex + i, 0, newRow)
    }
  }

  public removeRows(rowIndex: number, count = 1) {
    if (rowIndex < 0 || rowIndex + count > this.matrix.length) {
      throw new Error('Index out of bounds')
    }
    this.matrix.splice(rowIndex, count)
  }

  public insertCols(colIndex: number, count = 1, getDefaultValue: (coords: { rowIndex: number, colIndex: number }) => T) {
    if (colIndex < 0 || colIndex > this.matrix[0]!.length) {
      throw new Error('Index out of bounds')
    }
    this.matrix.forEach((row, rowIndex) => {
      for (let i = 0; i < count; i += 1) {
        row.splice(colIndex + i, 0, getDefaultValue({ rowIndex, colIndex: colIndex + i }))
      }
    })
  }

  public removeCols(colIndex: number, count = 1) {
    if (colIndex < 0 || colIndex + count > this.matrix[0]!.length) {
      throw new Error('Index out of bounds')
    }
    this.matrix.forEach(row => row.splice(colIndex, count))
  }

  clone(): Mx<T> {
    return new Mx(this.matrix.map(row => [...row]))
  }

  rows(): T[][] {
    return this.matrix
  }

  cols(): T[][] {
    return this.toTransposed().rows()
  }

  toTransposed(): Mx<T> {
    return new Mx<T>(this.matrix[0]!.map((_, colIndex) => this.matrix.map(row => row[colIndex]!)))
  }

  map<U>(callback: (value: T, position: [number, number], matrix: T[][]) => U): Mx<U> {
    return new Mx(
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

  keepNumbers(): Mx<number | null> {
    return this.map((value) => {
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value
      }
      return null
    })
  }

  flat(): T[] {
    return this.matrix.flat()
  }
}

export function isMxArray(mxArray: unknown): mxArray is unknown[][] {
  if (!Array.isArray(mxArray) || mxArray.length === 0) {
    return false
  }
  if (!Array.isArray(mxArray[0]) || mxArray[0]!.length === 0) {
    return false
  }

  const nbrOfCols = mxArray[0]!.length
  return mxArray.slice(1).every(row => Array.isArray(row) && row.length === nbrOfCols)
}
