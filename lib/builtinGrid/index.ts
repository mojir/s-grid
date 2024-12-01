import { functions } from './functions'
import type { CellDTO } from '~/dto/CellDTO'
import type { GridDTO } from '~/dto/GridDTO'

export const builtinGrid: GridDTO = {
  name: '**functions**',
  hidden: true,
  rows: functions.length,
  cols: 2,
  cells: functions.reduce((acc: Record<string, CellDTO>, { name, fn, description }, index) => {
    acc[`A${index + 1}`] = { input: `=${fn}`, alias: name }
    acc[`B${index + 1}`] = { input: description }
    return acc
  }, {}),
}
