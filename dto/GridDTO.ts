import type { CellDTO } from './CellDTO'
import { defaultNumberOfCols, defaultNumberOfRows } from '~/lib/constants'
import { parseCsv } from '~/lib/csvParser'
import { getColId, getRowId } from '~/lib/utils'

export async function createGridDtoFromCsv(name: string, csv: string): Promise<GridDTO> {
  const data = await parseCsv(csv)
  const cells: Record<string, CellDTO> = {}
  let cols = defaultNumberOfCols
  const rows = Math.max(data.length, defaultNumberOfRows)
  data.forEach((values, row) => {
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
  hidden?: boolean
  rows: number
  cols: number
  cells: Record<string, CellDTO>
}
