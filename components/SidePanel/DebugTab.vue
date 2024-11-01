<script setup lang="ts">
import { Color } from '@/lib/color'

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

console.log(colors)

const complementColors = computed(() => {
  return colors.map(c => c.toggleLightness())
})
</script>

<template>
  <div
    class="flex flex-col w-full text-sm dark:text-slate-400 text-gray-600 gap-2"
  >
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
