<script setup lang="ts">
import type { StyleJustify } from '~/lib/CellStyle'

const { grid } = useGrid()

const cellId = computed(() => grid.value.position.value)

const justify = ref<StyleJustify | null>(null)

watch(cellId, (newCellId) => {
  justify.value = grid.value.getCell(newCellId).style.value.justify
})

function onUpdateLeft(value: boolean) {
  justify.value = value ? 'left' : null
  grid.value.getCell(cellId.value).style.value.justify = justify.value
}

function onUpdateCenter(value: boolean) {
  justify.value = value ? 'center' : null
  grid.value.getCell(cellId.value).style.value.justify = justify.value
}

function onUpdateRight(value: boolean) {
  justify.value = value ? 'right' : null
  grid.value.getCell(cellId.value).style.value.justify = justify.value
}
</script>

<template>
  <div class="flex gap-1">
    <ToggleButton
      :model-value="justify === 'left'"
      icon-name="mdi:format-align-left"
      @update:model-value="onUpdateLeft"
    />
    <ToggleButton
      :model-value="justify === 'center'"
      icon-name="mdi:format-align-center"
      @update:model-value="onUpdateCenter"
    />
    <ToggleButton
      :model-value="justify === 'right'"
      icon-name="mdi:format-align-right"
      @update:model-value="onUpdateRight"
    />
  </div>
</template>
