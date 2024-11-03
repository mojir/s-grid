<script setup lang="ts">
import type { StyleAlign } from '~/lib/CellStyle'

const { grid } = useGrid()

const cellId = computed(() => grid.value.position.value)

const align = ref<StyleAlign | null>(null)

watch(cellId, (newCellId) => {
  const cell = grid.value.getCell(newCellId)
  align.value = cell.style.value.align
})

function onUpdateTop(value: boolean) {
  align.value = value ? 'top' : null
  grid.value.getCell(cellId.value).style.value.align = align.value
}

function onUpdateCenter(value: boolean) {
  align.value = value ? 'middle' : null
  grid.value.getCell(cellId.value).style.value.align = align.value
}

function onUpdateBottom(value: boolean) {
  align.value = value ? 'bottom' : null
  grid.value.getCell(cellId.value).style.value.align = align.value
}
</script>

<template>
  <div class="flex gap-1">
    <ToggleButton
      :model-value="align === 'top'"
      icon-name="mdi:format-vertical-align-top"
      @update:model-value="onUpdateTop"
    />
    <ToggleButton
      :model-value="align === 'middle'"
      icon-name="mdi:format-vertical-align-center"
      @update:model-value="onUpdateCenter"
    />
    <ToggleButton
      :model-value="align === 'bottom'"
      icon-name="mdi:format-vertical-align-bottom"
      @update:model-value="onUpdateBottom"
    />
  </div>
</template>
