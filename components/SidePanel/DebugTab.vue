<script setup lang="ts">
const { exec } = useCommandCenter()

enum TypeEnum {
  RangeToNumber = 'RangeToNumber',
}

type SourceRecord = {
  name: string
  description: string
  example?: string
  fn?: string
  inputType?: TypeEnum
}
const source: SourceRecord[] = [
  {
    name: 'AS_RANGE',
    description: 'Returns range even if trarget is a single cell.',
    fn: '=#(if (array? %) % [%])',
  },
  {
    name: 'AS_FLAT_RANGE',
    description: 'Returns range even if trarget is a single cell.',
    fn: '=#(if (array? %) (flatten %) [%])',
  },
  {
    name: 'SUM',
    description: 'Adds all the numbers in a range.',
    example: '=SUM(A1:A10)',
    fn: '=#(reduce + 0 (filter number? (AS_FLAT_RANGE %)))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'COUNT',
    description: 'Counts the number of numeric values in a range.',
    example: '=COUNT(A1:A10)',
    fn: '=#(count (filter number? (AS_FLAT_RANGE %)))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'COUNTA',
    description: 'Counts the number of non-empty cells in a range.',
    example: '=COUNTA(A1:A10)',
    fn: '=#(count (filter (complement nil?) (AS_FLAT_RANGE %)))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'AVERAGE',
    description: 'Calculates the average of numbers in a range.',
    example: '=AVERAGE(A1:A10)',
    fn: '=#(/ (SUM %) (COUNT %))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'MAX',
    description: 'Returns the maximum value in a range.',
    example: '=MAX(A1:A10)',
    fn: '=#(reduce max 0 (filter number? (AS_FLAT_RANGE %)))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'MIN',
    description: 'Returns the minimum value in a range.',
    example: '=MIN(A1:A10)',
    fn: '=#(let [numbers (filter number? (AS_FLAT_RANGE %))] (if (empty? numbers) 0 (reduce min numbers)))',
    inputType: TypeEnum.RangeToNumber,
  },
  {
    name: 'IF',
    description: 'Returns one value if a condition is true and another value if it\'s false.',
    example: '=IF(A1 > 10, "Yes", "No")',
  },
  {
    name: 'IFS',
    description: 'Returns a value based on multiple conditions.',
    example: '=IFS(A1 > 10, "Yes", A1 > 5, "Maybe", TRUE, "No")',
  },
  {
    name: 'VLOOKUP',
    description: 'Searches for a value in the first column of a range and returns a value in the same row from another column.',
    example: '=VLOOKUP("search_key", A1:B10, 2, FALSE)',
  },
  {
    name: 'HLOOKUP',
    description: 'Searches for a value in the first row of a range and returns a value in the same column from another row.',
    example: '=HLOOKUP("search_key", A1:B10, 2, FALSE)',
  },
  {
    name: 'INDEX',
    description: 'Returns the value of a cell in a specified row and column.',
    example: '=INDEX(A1:B10, 2, 1)',
  },
  {
    name: 'MATCH',
    description: 'Searches for a value in a range and returns the relative position of that item.',
    example: '=MATCH("search_key", A1:A10, 0)',
  },
  {
    name: 'LOOKUP',
    description: 'Searches for a value in a range and returns a value in the same position from another range.',
    example: '=LOOKUP("search_key", A1:A10, B1:B10)',
  },
  {
    name: 'IMPORTRANGE',
    description: 'Imports a range of cells from a specified spreadsheet.',
    example: '=IMPORTRANGE("spreadsheet_url", "Sheet1!A1:B10")',
  },
  {
    name: 'SUMIF',
    description: 'Adds the cells specified by a given condition.',
    example: '=SUMIF(A1:A10, ">10")',
  },
  {
    name: 'SUMIFS',
    description: 'Adds the cells specified by multiple conditions.',
    example: '=SUMIFS(A1:A10, B1:B10, ">10", C1:C10, "<20")',
  },
  {
    name: 'COUNTIF',
    description: 'Counts the number of cells that meet a condition.',
    example: '=COUNTIF(A1:A10, ">10")',
  },
  {
    name: 'COUNTIFS',
    description: 'Counts the number of cells that meet multiple conditions.',
    example: '=COUNTIFS(A1:A10, ">10", B1:B10, "<20")',
  },
  {
    name: 'TEXT',
    description: 'Converts a number into text in a specified format.',
    example: '=TEXT(A1, "0.00")',
  },
  {
    name: 'CONCATENATE',
    description: 'Joins together two or more strings.',
    example: '=CONCATENATE(A1, " ", B1)',
  },
  {
    name: 'SPLIT',
    description: 'Divides text around a specified character or string and puts each fragment into a separate cell in the row.',
    example: '=SPLIT(A1, " ")',
  },
  {
    name: 'LEFT',
    description: 'Returns a specified number of characters from the start of a text string.',
    example: '=LEFT(A1, 3)',
  },
  {
    name: 'RIGHT',
    description: 'Returns a specified number of characters from the end of a text string.',
    example: '=RIGHT(A1, 3)',
  },
  {
    name: 'MID',
    description: 'Returns a segment of a text string starting at a specified position.',
    example: '=MID(A1, 2, 3)',
  },
  {
    name: 'LEN',
    description: 'Returns the length of a text string.',
    example: '=LEN(A1)',
  },
  {
    name: 'TRIM',
    description: 'Removes leading and trailing spaces from a text string.',
    example: '=TRIM(A1)',
  },
  {
    name: 'UPPER',
    description: 'Converts a text string to uppercase.',
    example: '=UPPER(A1)',
  },
  {
    name: 'LOWER',
    description: 'Converts a text string to lowercase.',
    example: '=LOWER(A1)',
  },
  {
    name: 'PROPER',
    description: 'Capitalizes the first letter of each word in a text string.',
    example: '=PROPER(A1)',
  },
  {
    name: 'SUBSTITUTE',
    description: 'Replaces existing text with new text in a string.',
    example: '=SUBSTITUTE(A1, "old_text", "new_text")',
  },
  {
    name: 'REPT',
    description: 'Repeats text a specified number of times.',
    example: '=REPT(A1, 3)',
  },
  {
    name: 'FIND',
    description: 'Returns the position of a substring within a string.',
    example: '=FIND("search_text", A1)',
  },
  {
    name: 'SEARCH',
    description: 'Similar to FIND, but case-insensitive.',
    example: '=SEARCH("search_text", A1)',
  },
  {
    name: 'DATE',
    description: 'Converts a year, month, and day into a date.',
    example: '=DATE(2023, 1, 1)',
  },
  {
    name: 'TODAY',
    description: 'Returns the current date.',
    example: '=TODAY()',
  },
  {
    name: 'NOW',
    description: 'Returns the current date and time.',
    example: '=NOW()',
  },
  {
    name: 'DAY',
    description: 'Returns the day of the month from a date.',
    example: '=DAY(A1)',
  },
  {
    name: 'MONTH',
    description: 'Returns the month from a date.',
    example: '=MONTH(A1)',
  },
  {
    name: 'YEAR',
    description: 'Returns the year from a date.',
    example: '=YEAR(A1)',
  },
  {
    name: 'HOUR',
    description: 'Returns the hour from a time.',
    example: '=HOUR(A1)',
  },
  {
    name: 'MINUTE',
    description: 'Returns the minute from a time.',
    example: '=MINUTE(A1)',
  },
  {
    name: 'SECOND',
    description: 'Returns the second from a time.',
    example: '=SECOND(A1)',
  },
  {
    name: 'WEEKDAY',
    description: 'Returns the day of the week from a date.',
    example: '=WEEKDAY(A1)',
  },
  {
    name: 'DAYS',
    description: 'Returns the number of days between two dates.',
    example: '=DAYS(A1, B1)',
  },
  {
    name: 'NETWORKDAYS',
    description: 'Returns the number of working days between two dates.',
    example: '=NETWORKDAYS(A1, B1)',
  },
  {
    name: 'EDATE',
    description: 'Returns a date a specified number of months before or after another date.',
    example: '=EDATE(A1, 1)',
  },
  {
    name: 'EOMONTH',
    description: 'Returns the last day of the month a specified number of months before or after another date.',
    example: '=EOMONTH(A1, 1)',
  },
  {
    name: 'YEARFRAC',
    description: 'Returns the year fraction representing the number of whole days between start_date and end_date.',
    example: '=YEARFRAC(A1, B1)',
  },
  {
    name: 'RANDBETWEEN',
    description: 'Returns a random number between two specified values.',
    example: '=RANDBETWEEN(1, 100)',
  },
  {
    name: 'RAND',
    description: 'Returns a random number between 0 and 1.',
    example: '=RAND()',
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

  exec('MoveTo!', 'A12')

  rangeToNumberSource.forEach((item) => {
    exec('SetInput!', item.name)
    exec('Move!', 'right')
    exec('SetInput!', `=(${item.name} ${range})`)
    exec('SetFormatter!', '#(/ (round (* % 100)) 100)')
    exec('Move!', 'left')
    exec('Move!', 'down')
  })

  exec('MoveTo!', 'D1')
  exec('SetInput!', 'Functions')
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

  // exec('SetInput!', 'Formatters', 'E1')
  // exec('Move!', 'down')
  // exec('CreateNamedFunction!', 'FMT_PRECISION_2', '=#(reduce + (filter number? (flatten %)))')

  exec('ResetSelection!')
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
  </div>
</template>
