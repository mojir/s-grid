const rowStringRegExp = /^\d+$/

export class Row {
  private constructor(
    public readonly index: number,
    public readonly id: string,
    public height: number,
  ) {
  }

  static create(index: number, width: number): Row {
    return new Row(index, Row.getRowIdFromIndex(index), width)
  }

  static isRowString(id: unknown): id is string {
    return typeof id === 'string' && rowStringRegExp.test(id)
  }

  static getRowIdFromIndex(rowIndex: number) {
    return `${rowIndex + 1}`
  }

  static getRowIndexFromId(rowId: string) {
    return Number(rowId) - 1
  }
}
