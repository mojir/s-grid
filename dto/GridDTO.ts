import type { CellDTO } from './CellDTO'
import { getColId, getRowId } from '~/lib/utils'

export function createGridDtoFromCsv(name: string, csv: string): GridDTO {
  const lines = csv.split('\n')
  const cells: Record<string, CellDTO> = {}
  let cols = 0
  const rows = lines.length
  lines.forEach((line, row) => {
    const values = line.split(',')
    cols = Math.max(cols, values.length)
    values.forEach((value, col) => {
      const key = `${getColId(col)}${getRowId(row)}`
      cells[key] = { input: value }
    })
  })

  return {
    name,
    rows: Number(rows),
    cols: Number(cols),
    cells,
  }
}

export type GridDTO = {
  name: string
  rows: number
  cols: number
  cells: Record<string, CellDTO>
}
