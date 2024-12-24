<script setup lang="ts">
import type { WatchHandle } from 'vue'
import type { Color } from '~/lib/color'
import { colorPalette } from '~/lib/color'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const textColor = ref<Color | null>(null)

let watchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  textColor.value = grid.value.getTextColor(newSelection)

  const textColorRefs = newSelection
    .getAllCellLocators()
    .map(locator => locator.getCell().textColor)

  watchHandle?.stop()
  watchHandle = watch(textColorRefs, () => {
    textColor.value = grid.value.getTextColor(newSelection)
  })
}, { immediate: true })

function onUpdateTextColor(value: Color | null) {
  textColor.value = value
  grid.value.setTextColor(value, null)
}
</script>

<template>
  <div>
    <ColorPicker
      :model-value="textColor"
      :color-palette="colorPalette"
      icon="mdi-format-color-text"
      @update:model-value="onUpdateTextColor"
    />
  </div>
</template>
