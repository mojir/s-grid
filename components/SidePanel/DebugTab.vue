<script setup lang="ts">
const { exec } = useCommandCenter()

function addSampleData() {
  exec('ClearAllCells!')

  exec('Select!', 'A1-D1')
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
  exec('SetInput!', '35', 'B5')
  exec('SetInput!', '40', 'B6')
  exec('SetInput!', '?', 'B7')
  exec('SetInput!', '50', 'B8')
  exec('SetInput!', '22', 'B9')
  exec('SetInput!', '33', 'B10')

  exec('SetInput!', 'Sum:', 'A11')
  exec('SetStyle!', 'bold', true, 'A11')
  exec('SetStyle!', 'italic', true, 'A11')
  exec('SetInput!', 'Avg:', 'A12')
  exec('SetStyle!', 'bold', true, 'A12')
  exec('SetStyle!', 'italic', true, 'A12')
  exec('SetInput!', '=(Sum B2-B10)', 'B11')
  exec('SetStyle!', 'italic', true, 'B11')
  exec('SetInput!', '=(Avg B2-B10)', 'B12')
  exec('SetStyle!', 'italic', true, 'B12')
  exec('SetFormatter!', '#(/ (round (* % 100)) 100)', 'B12')

  exec('SetInput!', 'Functions', 'D1')
  exec('SetInput!', '=#(reduce + (filter number? %))', 'D2')
  exec('SetAlias!', 'Sum', 'D2')
  exec('SetInput!', '=#(let [list (filter number? %) len (count list)] (/ (reduce + list) len))', 'D3')
  exec('SetAlias!', 'Avg', 'D3')
  exec('SetStyle!', 'italic', true, 'D2-D3')

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
