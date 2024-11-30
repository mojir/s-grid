import { CellDTO } from './CellDTO'
import { getColId, getRowId } from '~/lib/utils'

export class GridDTO {
  public readonly name: string
  public readonly rows: number
  public readonly cols: number
  public readonly cells: Record<string, CellDTO>

  constructor(grid: GridDTO) {
    this.name = grid.name
    this.rows = grid.rows
    this.cols = grid.cols
    this.cells = grid.cells
    Object.freeze(this.cells)
  }

  static fromCsv(csv: string): GridDTO {
    const lines = csv.split('\n')
    const [name, rows, cols] = lines[0].split(',')
    const cells: Record<string, CellDTO> = {}
    lines.slice(1).forEach((line, row) => {
      const values = line.split(',')
      values.forEach((value, col) => {
        const key = `${getColId(col)}${getRowId(row)}`
        cells[key] = new CellDTO({ input: value })
      })
    })

    return new GridDTO({
      name,
      rows: Number(rows),
      cols: Number(cols),
      cells,
    })
  }
}
