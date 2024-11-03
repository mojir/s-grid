const rowStringRegExp = /^\d+$/

export class Row {
  private constructor(
    public readonly index: number,
    public readonly id: string,
    public readonly height: Ref<number>,
  ) {
  }

  static create(index: number, height: number): Row {
    return new Row(index, Row.getRowIdFromIndex(index), ref(height))
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
