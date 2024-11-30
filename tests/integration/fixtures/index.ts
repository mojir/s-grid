import oneGrid10NamesWithAgesCsv from './oneGrid10NamesWithAges.csv?raw'
import { GridDTO } from '~/dto/GridDTO'

export const oneGrid10NamesWithAges = GridDTO.fromCsv(oneGrid10NamesWithAgesCsv)

export default {
  oneGrid10NamesWithAges,
}
