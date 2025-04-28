import type { AliasesDTO } from './AliasesDTO'
import type { GridDTO } from './GridDTO'
import { defaultNbrOfCols, defaultNbrOfRows } from '~/lib/constants'

export type ProjectDTO = {
  name: string
  grids: GridDTO[]
  aliases: AliasesDTO
  currentGridIndex: number
}

export function createEmptyProject(): ProjectDTO {
  return {
    name: 'Untitled',
    grids: [
      {
        name: 'Grid1',
        nbrOfRows: defaultNbrOfRows,
        nbrOfCols: defaultNbrOfCols,
        cells: {},
        rowHeights: {},
        colWidths: {},
      },
    ],
    currentGridIndex: 0,
    aliases: {},
  }
}
