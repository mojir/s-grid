<script setup lang="ts">
import type { StyleTextDecoration } from '~/lib/CellStyle'

const { grid } = useGrid()

const cellId = computed(() => grid.value.activeCellId.value)

const textDecoration = ref<StyleTextDecoration | null>(null)

watch(cellId, (newCellId) => {
  const cell = grid.value.getCell(newCellId)
  textDecoration.value = cell?.style.value.textDecoration ?? null
})

function onUpdateUnderline(value: boolean) {
  textDecoration.value = value ? 'underline' : null
  grid.value.getOrCreateCell(cellId.value).style.value.textDecoration = textDecoration.value
}

function onUpdateLineThrough(value: boolean) {
  textDecoration.value = value ? 'line-through' : null
  grid.value.getOrCreateCell(cellId.value).style.value.textDecoration = textDecoration.value
}
</script>

<template>
  <div class="flex gap-1">
    <ToggleButton
      :model-value="textDecoration === 'underline'"
      icon-name="mdi:format-underline"
      @update:model-value="onUpdateUnderline"
    />
    <ToggleButton
      :model-value="textDecoration === 'line-through'"
      icon-name="mdi:format-strikethrough-variant"
      @update:model-value="onUpdateLineThrough"
    />
  </div>
</template>
