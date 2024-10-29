const colStringRegExp = /^[A-Z]+$/

export class Col {
  private constructor(
    public readonly index: number,
    public readonly id: string,
    public width: number,
  ) {
  }

  static create(index: number, width: number): Col {
    return new Col(index, Col.getColIdFromIndex(index), width)
  }

  static isColString(id: unknown): id is string {
    return typeof id === 'string' && colStringRegExp.test(id)
  }

  static getColIdFromIndex(colIndex: number) {
    let result = ''
    while (colIndex >= 0) {
      result = String.fromCharCode((colIndex % 26) + 65) + result
      colIndex = Math.floor(colIndex / 26) - 1
    }
    return result
  }

  static getColIndexFromId(colId: string) {
    return colId.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0)
  }
}
