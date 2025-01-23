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

  public clone(): Mx<T> {
    return new Mx(this.matrix.map(row => [...row]))
  }

  public rows(): T[][] {
    return this.matrix
  }

  public cols(): T[][] {
    return this.toTransposed().rows()
  }

  public toTransposed(): Mx<T> {
    return new Mx<T>(this.matrix[0]!.map((_, colIndex) => this.matrix.map(row => row[colIndex]!)))
  }

  public map<U>(callback: (value: T, position: [number, number], matrix: T[][]) => U): Mx<U> {
    return new Mx(
      this.matrix.map((row, rowIndex) =>
        row.map((value, colIndex) =>
          callback(value, [rowIndex, colIndex], this.matrix),
        ),
      ),
    )
  }

  public forEach(callback: (value: T, position: [number, number], matrix: T[][]) => void): void {
    this.matrix.forEach((row, rowIndex) =>
      row.forEach((value, colIndex) =>
        callback(value, [rowIndex, colIndex], this.matrix),
      ),
    )
  }

  public keepNumbers(): Mx<number | null> {
    return this.map((value) => {
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value
      }
      return null
    })
  }

  public flat(): T[] {
    return this.matrix.flat()
  }

  public stringify(title: string, {
    maxColumnWidth = 50,
    maxRows = 16,
    maxCols = 8,
  }: {
    title?: string
    maxColumnWidth?: number
    maxRows?: number
    maxCols?: number
  } = {}): string {
    const rowOverflow = this.matrix.length > maxRows
    const colOverflow = this.matrix[0]!.length > maxCols

    let truncatedMatrix: unknown[][] = this.matrix.map(row => [...row])
    const middleRow = Math.ceil(maxRows / 2)
    const middleCol = Math.ceil(maxCols / 2)
    if (rowOverflow) {
      truncatedMatrix = [
        ...this.matrix.slice(0, middleRow),
        Array.from({ length: this.matrix[0]!.length }, () => '¦'),
        ...this.matrix.slice(-middleRow),
      ]
    }
    if (colOverflow) {
      truncatedMatrix = truncatedMatrix.map(row => [
        ...row.slice(0, middleCol),
        '…',
        ...row.slice(-middleCol),
      ])
    }

    const withRowIndices = truncatedMatrix
      .map((row, i) => {
        const label = !rowOverflow
          ? `${i}`
          : i < middleRow
            ? `${i}`
            : i === middleRow
              ? '¦'
              : `${i + this.matrix.length - maxRows - 1}`
        return [label.padStart(`${truncatedMatrix.length - (rowOverflow ? 2 : 1)}`.length), ...row.map(cell => `${(cell)}`)]
      })
    const colIndices = colOverflow
      ? [
          '',
          ...truncatedMatrix[0]!.slice(0, middleCol).map((_, i) => `${i}`),
          '…',
          ...truncatedMatrix[0]!.slice(middleCol + 1).map((_, i) => `${i + this.matrix[0]!.length - middleCol}`),
        ]
      : ['', ...truncatedMatrix[0]!.map((_, i) => `${i}`)]
    const fullMatrix = [colIndices, ...withRowIndices]

    if (colOverflow && rowOverflow) {
      fullMatrix[middleRow + 1]![middleCol + 1] = ' '
    }

    const columnWidths = fullMatrix[0]!.map((_, colIndex) =>
      Math.min(maxColumnWidth, Math.max(...fullMatrix.map(row => row[colIndex]!.length))),
    )

    const info = `${title}   rows=${this.matrix.length}, cols=${this.matrix[0]!.length}, cells=${this.matrix.length * this.matrix[0]!.length}`
    const underline = '―'.repeat(info.length)
    return [
      info,
      underline,
      ...fullMatrix.map(row =>
        row.map((cell, i) => {
          if (cell.length > columnWidths[i]!) {
            return cell.slice(0, columnWidths[i]! - 1) + '…'
          }
          return cell.padEnd(columnWidths[i]!)
        }).join(' '),
      ),
    ].join('\n')
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
