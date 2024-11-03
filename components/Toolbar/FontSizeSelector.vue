<script setup lang="ts">
import { defaultFontSize, styleFontSizes, type StyleFontSize } from '~/lib/CellStyle'

const { grid } = useGrid()

const cellId = computed(() => grid.value.activeCellId.value)

const fontSize = ref<StyleFontSize>(defaultFontSize)

watch(cellId, (newCellId) => {
  const cell = grid.value.getCell(newCellId)
  fontSize.value = cell?.style.value.fontSize ?? defaultFontSize
})

function onUpdateFontSize(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value) as StyleFontSize
  console.log('onUpdateFontSize', value)
  grid.value.getOrCreateCell(cellId.value).style.value.fontSize = value
  grid.value.autoSetRowHeight(cellId.value)
}
</script>

<template>
  <div
    class="px-1 h-7  bg-transparent rounded-sm cursor-pointer text-sm"
  >
    <select
      v-model="fontSize"
      class="h-7 bg-transparent border-none focus:outline-none dark:text-gray-300 text-gray-700 rounded-sm cursor-pointer text-sm"
      @change="onUpdateFontSize"
    >
      <option
        v-for="size in styleFontSizes"
        :key="size"
        :value="size"
      >
        {{ size }}
      </option>
    </select>
  </div>
</template>
