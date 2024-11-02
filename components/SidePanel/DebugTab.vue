<script setup lang="ts">
import { Color } from '@/lib/color'

const { exec } = useCommandCenter()
const cs = ['00', '88', 'FF']
const colors: Color[] = [
  '#000000',
  '#000022',
  '#002200',
  '#002222',
  '#220000',
  '#220022',
  '#222200',
  '#222222',
  '#DDDDDD',
  '#DDDDFF',
  '#DDFFDD',
  '#DDFFFF',
  '#FFDDDD',
  '#FFDDFF',
  '#FFFFDD',
  '#FFFFFF',
  ...cs.flatMap(r => cs.flatMap(g => cs.map(b => `#${g}${r}${b}`))),
].map(Color.fromHex)

const complementColors = computed(() => {
  return colors.map(c => c.toggleLightness())
})

function addSampleData() {
  exec('ClearAllCells!')
  exec('SetCellInput!', 'A1', 'Name:')
  exec('SetCellStyle!', 'A1', 'bold', true)
  exec('SetCellInput!', 'A2', 'Albert')
  exec('SetCellInput!', 'A3', 'Bob')
  exec('SetCellInput!', 'A4', 'Charlie')
  exec('SetCellInput!', 'A5', 'David')
  exec('SetCellInput!', 'A6', 'Eve')
  exec('SetCellInput!', 'A7', 'Frank')
  exec('SetCellInput!', 'A8', 'Grace')
  exec('SetCellInput!', 'A9', 'Hank')
  exec('SetCellInput!', 'A10', 'Ivy')

  exec('SetCellInput!', 'B1', 'Age:')
  exec('SetCellStyle!', 'B1', 'bold', true)
  exec('SetCellInput!', 'B2', '25')
  exec('SetCellInput!', 'B3', '30')
  exec('SetCellInput!', 'B4', '28')
  exec('SetCellInput!', 'B5', '35')
  exec('SetCellInput!', 'B6', '40')
  exec('SetCellInput!', 'B7', '11')
  exec('SetCellInput!', 'B8', '50')
  exec('SetCellInput!', 'B9', '22')
  exec('SetCellInput!', 'B10', '33')

  exec('SetCellInput!', 'A11', 'Sum:')
  exec('SetCellStyle!', 'A11', 'bold', true)
  exec('SetCellStyle!', 'A11', 'italic', true)
  exec('SetCellInput!', 'A12', 'Avg:')
  exec('SetCellStyle!', 'A12', 'bold', true)
  exec('SetCellStyle!', 'A12', 'italic', true)
  exec('SetCellInput!', 'B11', '=(Sum B2-B10)')
  exec('SetCellStyle!', 'B11', 'italic', true)
  exec('SetCellInput!', 'B12', '=(Avg B2-B10)')
  exec('SetCellStyle!', 'B12', 'italic', true)
  exec('SetCellFormatter!', 'B12', '#(/ (round (* % 100)) 100)')

  exec('SetCellInput!', 'F1', `=#(reduce + %)`)
  exec('SetCellAlias!', 'F1', 'Sum')
  exec('SetCellInput!', 'F2', `=#(let [len (count %), list %] (/ (reduce + list) len))`)
  exec('SetCellAlias!', 'F2', 'Avg')
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
    <div class="flex flex-row w-full gap-4 p-4 bg-slate-500">
      <div class="flex-1 flex flex-col gap-4 bg-slate-100 p-4">
        <div
          v-for="(color, i) of colors"
          :key="i"
          :style="{ backgroundColor: color.style }"
          class="flex-1 flex min-h-6 rounded-lg"
        />
      </div>
      <div class="flex-1 flex flex-col gap-4 bg-slate-900 p-4">
        <div
          v-for="(color, i) of complementColors"
          :key="i"
          :style="{ backgroundColor: color.style }"
          class="flex-1 flex min-h-6 rounded-lg"
        />
      </div>
    </div>
  </div>
</template>
