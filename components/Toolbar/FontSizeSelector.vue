<script setup lang="ts">
import { defaultFontSize, styleFontSizes, type StyleFontSize } from '~/lib/CellStyle'

const { grid } = useGrid()

const cellId = computed(() => grid.value.position.value)

const fontSize = ref<StyleFontSize>(defaultFontSize)

watch(cellId, (newCellId) => {
  fontSize.value = grid.value.getCell(newCellId).style.value.fontSize
})

function onUpdateFontSize(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value) as StyleFontSize
  grid.value.setStyle('fontSize', value)
  grid.value.autoSetRowHeight()
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
