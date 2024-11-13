const colStringIdRegExp = /^[A-Z]+$/
const colResizeIdRegExp = /^resize-col:([A-Z]+)$/

export type CaptialLetter = `A` | `B` | `C` | `D` | `E` | `F` | `G` | `H` | `I` | `J` | `K` | `L` | `M` | `N` | `O` | `P` | `Q` | `R` | `S` | `T` | `U` | `V` | `W` | `X` | `Y` | `Z`
export type ColIdString = `${CaptialLetter}` | `${CaptialLetter}${CaptialLetter}`

export type ColRange = {
  colIndex: number
  count: number
}

export class Col {
  public readonly index: Ref<number>
  public readonly width: Ref<number>
  public readonly id: ComputedRef<ColIdString>

  private constructor(
    index: number,
    width: number,
  ) {
    this.index = ref(index)
    this.width = ref(width)
    this.id = computed(() => Col.getColIdFromIndex(this.index.value))
  }

  static create(index: number, width: number): Col {
    return new Col(index, width)
  }

  static isColIdString(id: unknown): id is ColIdString {
    return typeof id === 'string' && colStringIdRegExp.test(id)
  }

  static isResizeColId(id: string): boolean {
    return typeof id === 'string' && colResizeIdRegExp.test(id)
  }

  static getColIdFromIndex(colIndex: number): ColIdString {
    let result = ''
    while (colIndex >= 0) {
      result = String.fromCharCode((colIndex % 26) + 65) + result
      colIndex = Math.floor(colIndex / 26) - 1
    }
    if (result.length > 2) {
      throw new Error(`Col index ${colIndex} is out of range`)
    }
    return result as ColIdString
  }

  static getColIndexFromId(colId: ColIdString) {
    return colId.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0)
  }
}
