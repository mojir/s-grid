import type { CellDTO } from './CellDTO'
import { defaultNbrOfCols, defaultNbrOfRows } from '~/lib/constants'
import { parseCsv } from '~/lib/parseCsv'

export async function createGridDtoFromCsv(name: string, csv: string): Promise<GridDTO> {
  const data = parseCsv(csv)
  const cells: Record<string, CellDTO> = {}
  const nbrOfRows = Math.max(data.length, defaultNbrOfRows)
  let nbrOfCols = defaultNbrOfCols
  data.forEach((values, row) => {
    nbrOfCols = Math.max(nbrOfCols, values.length)
    values.forEach((value, col) => {
      const key = `${getColId(col)}${getRowId(row)}`
      cells[key] = { input: value }
    })
  })

  return {
    name,
    nbrOfRows,
    nbrOfCols,
    cells,
    rowHeights: {},
    colWidths: {},
  }
}

export type GridDTO = {
  name: string
  nbrOfRows: number
  nbrOfCols: number
  cells: Record<string, CellDTO>
  // rowId -> height
  rowHeights: Record<string, number>
  // colId -> width
  colWidths: Record<string, number>
}
