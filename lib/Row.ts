const rowStringIdRegExp = /^\d+$/
const colResizeIdRegExp = /^resize-row:(\d+)$/

export type Number = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export type RowIdString = `${Number}` | `${Number}${Number}` | `${Number}${Number}${Number}` | `${Number}${Number}${Number}${Number}`

export class Row {
  public readonly index: Ref<number>
  public readonly height: Ref<number>
  public readonly id: ComputedRef<RowIdString>
  private constructor(
    index: number,
    height: number,
  ) {
    this.index = ref(index)
    this.height = ref(height)
    this.id = computed(() => Row.getRowIdFromIndex(this.index.value))
  }

  static create(index: number, height: number): Row {
    return new Row(index, height)
  }

  static isRowIdString(id: unknown): id is RowIdString {
    return typeof id === 'string' && rowStringIdRegExp.test(id)
  }

  static isResizeRowId(id: string): boolean {
    return typeof id === 'string' && colResizeIdRegExp.test(id)
  }

  static getRowIdFromIndex(rowIndex: number): RowIdString {
    if (rowIndex < 9999) {
      return `${rowIndex + 1}` as RowIdString
    }
    throw new Error(`Row index ${rowIndex} is out of range`)
  }

  static getRowIndexFromId(rowId: RowIdString) {
    return Number(rowId) - 1
  }
}
