<script setup lang="ts">
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)

const commandCenter = gridProject.value.commandCenter

enum TypeEnum {
  RangeToNumber = 'RangeToNumber',
}

type SourceRecord = {
  name: string
  description: string
  fn: string
  inputType?: TypeEnum
}
const source: SourceRecord[] = [
  {
    name: 'AS_RANGE',
    description: 'Returns range even if trarget is a single cell. Removes non-numeric values.',
    fn: '=#(filter number? (if (array? %) % [%]))',
  },
  {
    name: 'AS_RANGEA',
    description: 'Returns range even if trarget is a single cell. Removes empty cells.',
    fn: '=#(if (array? %) % [%])',
  },
  {
    name: 'AS_FLAT_RANGE',
    description: 'Returns flatten range even if trarget is a single cell. Removes non-numeric values.',
    fn: '=#(filter number? (if (array? %) (flatten %) [%]))',
  },
  {
    name: 'AS_FLAT_RANGEA',
    description: 'Returns flatten range even if trarget is a single cell. Removes empty cells.',
    fn: '=#(filter (complement nil?) (if (array? %) (flatten %) [%]))',
  },
  {
    name: 'SUM',
    description: 'Adds all the numbers in a range.',
    fn: '=#(reduce + 0 (AS_FLAT_RANGE %))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'COUNT',
    description: 'Counts the number of numeric values in a range.',
    fn: '=#(count (AS_FLAT_RANGE %))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'COUNTA',
    description: 'Counts the number of non-empty cells in a range.',
    fn: '=#(count (AS_FLAT_RANGEA %))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'AVERAGE',
    description: 'Calculates the average of numbers in a range.',
    fn: '=#(/ (SUM %) (COUNT %))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'MEDIAN',
    description: 'Calculates the average of numbers in a range.',
    fn: `=
  #(let [sorted (sort (AS_FLAT_RANGE %))
         cnt (count sorted)
         halfway (quot cnt 2)]
     (cond
       ; empty range, default to 0
       (zero? cnt)
       0
       
       (odd? cnt)
       (nth sorted halfway)
       
       :else
       (let [bottom (dec halfway)
             bottom-val (nth sorted bottom)
             top-val (nth sorted halfway)]
         (/ (+ bottom-val top-val) 2))))`,
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'MAX',
    description: 'Returns the maximum value in a range.',
    fn: '=#(let [numbers (AS_FLAT_RANGE %)] (if (empty? numbers) 0 (reduce max numbers)))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'MIN',
    description: 'Returns the minimum value in a range.',
    fn: '=#(let [numbers (AS_FLAT_RANGE %)] (if (empty? numbers) 0 (reduce min numbers)))',
    inputType: TypeEnum.RangeToNumber,
  },
].filter(item => item.fn)

const rangeToNumberSource = source.filter(item => item.inputType === TypeEnum.RangeToNumber)

const range = 'B2-B10'

function addSampleData() {
  commandCenter.exec('ClearAllCells!')

  commandCenter.exec('Select!', 'A1-B1')
  commandCenter.exec('SetBackgroundColor!', '#004400')
  commandCenter.exec('SetTextColor!', '#ffffff')
  commandCenter.exec('SetStyle!', 'bold', true)
  commandCenter.exec('SetStyle!', 'fontSize', 18)

  commandCenter.exec('SetInput!', 'Name', 'A1')
  commandCenter.exec('SetInput!', 'Albert', 'A2')
  commandCenter.exec('SetInput!', 'Bob', 'A3')
  commandCenter.exec('SetInput!', 'Charlie', 'A4')
  commandCenter.exec('SetInput!', 'David', 'A5')
  commandCenter.exec('SetInput!', 'Eve', 'A6')
  commandCenter.exec('SetInput!', 'Frank', 'A7')
  commandCenter.exec('SetInput!', 'Grace', 'A8')
  commandCenter.exec('SetInput!', 'Hank', 'A9')
  commandCenter.exec('SetInput!', 'Ivy', 'A10')

  commandCenter.exec('SetInput!', 'Age', 'B1')
  commandCenter.exec('SetStyle!', 'justify', 'right', 'B1')
  commandCenter.exec('SetInput!', '25', 'B2')
  commandCenter.exec('SetInput!', '30', 'B3')
  commandCenter.exec('SetInput!', '?', 'B4')
  commandCenter.exec('SetInput!', '40', 'B6')
  commandCenter.exec('SetInput!', '?', 'B7')
  commandCenter.exec('SetInput!', '50', 'B8')
  commandCenter.exec('SetInput!', '22', 'B9')
  commandCenter.exec('SetInput!', '33', 'B10')

  commandCenter.exec('Select!', range)
  commandCenter.exec('SetStyle!', 'justify', 'right')

  commandCenter.exec('MovePositionTo!', 'A15')

  rangeToNumberSource.forEach((item) => {
    commandCenter.exec('SetInput!', item.name)
    commandCenter.exec('MovePosition!', 'right')
    commandCenter.exec('SetInput!', `=(${item.name} ${range})`)
    commandCenter.exec('MovePosition!', 'left')
    commandCenter.exec('MovePosition!', 'down')
  })

  // exec('MovePositionTo!', 'D1')
  commandCenter.exec('MovePosition!', 'down')
  commandCenter.exec('SetInput!', 'Functions')
  commandCenter.exec('SetColWidth!', 200)
  commandCenter.exec('MovePosition!', 'right')
  commandCenter.exec('SetColWidth!', 600)
  commandCenter.exec('MovePosition!', 'left')
  source.forEach((item) => {
    commandCenter.exec('MovePosition!', 'down')
    commandCenter.exec('CreateNamedFunction!', item.name, item.fn)
    commandCenter.exec('MovePosition!', 'right')
    commandCenter.exec('SetInput!', item.description)
    commandCenter.exec('MovePosition!', 'left')
  })
  commandCenter.exec('MovePosition!', 'right')
  commandCenter.exec('ExpandSelectionTo!', 'E2')
  commandCenter.exec('SetStyle!', 'italic', true)

  commandCenter.exec('MovePositionTo!', 'A1')
}
</script>

<template>
  <div
    class="flex flex-col w-full text-sm dark:text-slate-400 text-gray-600 gap-2"
  >
    <button
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      @click="addSampleData"
    >
      Add sample data
    </button>
    <button
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      @click="commandCenter.exec('DeleteRows!', '3')"
    >
      DeleteRow 3
    </button>
    <button
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      @click="commandCenter.exec('InsertRowsBefore!', '5', 2)"
    >
      InsertRowBefore 5 2
    </button>
  </div>
</template>
