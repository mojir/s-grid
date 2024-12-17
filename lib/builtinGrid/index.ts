import { functions } from './functions'
import type { CellDTO } from '~/dto/CellDTO'
import type { GridDTO } from '~/dto/GridDTO'

export const builtinGrid: GridDTO = {
  name: '**functions**',
  hidden: true,
  rows: functions.length,
  cols: 2,
  cells: functions.reduce((acc: Record<string, CellDTO>, { fn, description }, index) => {
    acc[`A${index + 1}`] = { input: `=${fn}` }
    acc[`B${index + 1}`] = { input: description }
    return acc
  }, {}),
  alias: functions.reduce((acc: Record<string, string>, { name }, index) => {
    acc[name] = `A${index + 1}`
    return acc
  }, {}),
}
