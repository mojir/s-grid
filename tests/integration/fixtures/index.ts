import oneGrid10NamesWithAgesCsv from './oneGrid10NamesWithAges.csv?raw'
import usStatesCsv from './usStates.csv?raw'
import { createGridDtoFromCsv, type GridDTO } from '~/dto/GridDTO'

export const tenNamesWithAges = createGridDtoFromCsv('Names with ages', oneGrid10NamesWithAgesCsv)
export const usStates = createGridDtoFromCsv('US States', usStatesCsv)

const testFixtures: GridDTO[] = [
  tenNamesWithAges,
  usStates,
]

export default testFixtures
