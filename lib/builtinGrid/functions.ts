import { Lits } from '@mojir/lits'
import AS_RANGE from './lits/AS_RANGE.lits?raw'
import AS_RANGEA from './lits/AS_RANGEA.lits?raw'
import AS_FLAT_RANGE from './lits/AS_FLAT_RANGE.lits?raw'
import AS_FLAT_RANGEA from './lits/AS_FLAT_RANGEA.lits?raw'
import SUM from './lits/SUM.lits?raw'
import COUNT from './lits/COUNT.lits?raw'
import COUNTA from './lits/COUNTA.lits?raw'
import AVERAGE from './lits/AVERAGE.lits?raw'
import MEDIAN from './lits/MEDIAN.lits?raw'
import MAX from './lits/MAX.lits?raw'
import MIN from './lits/MIN.lits?raw'

type Function = {
  name: string
  fn: string
  description: string
}

const lits = new Lits({ debug: true })

const functionEntries: [string, string, string][] = [
  ['AS_RANGE', AS_RANGE, 'Returns range even if target is a single cell. Removes non-numeric values.'],
  ['AS_RANGEA', AS_RANGEA, 'Returns range even if trarget is a single cell. Removes empty cells.'],
  ['AS_FLAT_RANGE', AS_FLAT_RANGE, 'Returns flatten range even if trarget is a single cell. Removes non-numeric values.'],
  ['AS_FLAT_RANGEA', AS_FLAT_RANGEA, 'Returns flatten range even if trarget is a single cell. Removes empty cells.'],
  ['SUM', SUM, 'Adds all the numbers in a range.'],
  ['COUNT', COUNT, 'Counts the number of numeric values in a range.'],
  ['COUNTA', COUNTA, 'Counts the number of non-empty cells in a range.'],
  ['AVERAGE', AVERAGE, 'Calculates the average of numbers in a range.'],
  ['MEDIAN', MEDIAN, 'Calculates the median of numbers in a range.'],
  ['MAX', MAX, 'Returns the maximum value in a range.'],
  ['MIN', MIN, 'Returns the minimum value in a range.'],
]

export const functions: Function[] = functionEntries.map(([name, program, description]) => {
  const fn = lits.untokenize(lits.tokenize(program))
  return {
    name,
    fn,
    description,
  }
})
