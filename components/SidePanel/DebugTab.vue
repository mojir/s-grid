<script setup lang="ts">
const { exec } = useCommandCenter()

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
  exec('ClearAllCells!')

  exec('Select!', 'A1-E1')
  exec('SetBackgroundColor!', '#004400')
  exec('SetTextColor!', '#ffffff')
  exec('SetStyle!', 'bold', true)
  exec('SetStyle!', 'fontSize', 18)

  exec('SetInput!', 'Name', 'A1')
  exec('SetInput!', 'Albert', 'A2')
  exec('SetInput!', 'Bob', 'A3')
  exec('SetInput!', 'Charlie', 'A4')
  exec('SetInput!', 'David', 'A5')
  exec('SetInput!', 'Eve', 'A6')
  exec('SetInput!', 'Frank', 'A7')
  exec('SetInput!', 'Grace', 'A8')
  exec('SetInput!', 'Hank', 'A9')
  exec('SetInput!', 'Ivy', 'A10')

  exec('SetInput!', 'Age', 'B1')
  exec('SetStyle!', 'justify', 'right', 'B1')
  exec('SetInput!', '25', 'B2')
  exec('SetInput!', '30', 'B3')
  exec('SetInput!', '?', 'B4')
  exec('SetInput!', '40', 'B6')
  exec('SetInput!', '?', 'B7')
  exec('SetInput!', '50', 'B8')
  exec('SetInput!', '22', 'B9')
  exec('SetInput!', '33', 'B10')

  exec('Select!', range)
  exec('SetStyle!', 'justify', 'right')

  exec('MoveTo!', 'A12')

  rangeToNumberSource.forEach((item) => {
    exec('SetInput!', item.name)
    exec('Move!', 'right')
    exec('SetInput!', `=(${item.name} ${range})`)
    exec('Move!', 'left')
    exec('Move!', 'down')
  })

  exec('MoveTo!', 'D1')
  exec('SetInput!', 'Functions')
  exec('SetColWidth!', 200)
  exec('Move!', 'right')
  exec('SetColWidth!', 600)
  exec('Move!', 'left')
  source.forEach((item) => {
    exec('Move!', 'down')
    exec('CreateNamedFunction!', item.name, item.fn)
    exec('Move!', 'right')
    exec('SetInput!', item.description)
    exec('Move!', 'left')
  })
  exec('Move!', 'right')
  exec('ExpandSelectionTo!', 'E2')
  exec('SetStyle!', 'italic', true)

  exec('MoveTo!', 'A1')
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
      @click="exec('DeleteRow!', '1')"
    >
      DeleteRow 1
    </button>
    <button
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      @click="exec('InsertRowBefore!', '5', 2)"
    >
      InsertRowBefore 5 2
    </button>
  </div>
</template>
