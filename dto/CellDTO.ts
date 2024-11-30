import type { CellStyleDTO } from './CellStyleDTO'

export class CellDTO {
  public input?: string
  public formatter?: string
  public style?: CellStyleDTO
  public backgroundColor?: string
  public textColor?: string

  constructor(cell: CellDTO) {
    this.input = cell.input
    this.formatter = cell.formatter
    this.style = cell.style
    this.backgroundColor = cell.backgroundColor
    this.textColor = cell.textColor
  }
}
