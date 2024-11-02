export class CellStyle {
  public bold = false
  public italic = false

  public getJson() {
    return {
      bold: this.bold,
      italic: this.italic,
    }
  }
}
