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

const bgColor = ref<Color | null>(null)

let watchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  bgColor.value = grid.value.getBackgroundColor(newSelection)

  const bgColorRefs = newSelection.getCells().map(cell => cell.backgroundColor)

  watchHandle?.stop()
  watchHandle = watch(bgColorRefs, () => {
    bgColor.value = grid.value.getBackgroundColor(newSelection)
  })
}, { immediate: true })

function onUpdateBackgroundColor(value: Color | null) {
  bgColor.value = value
  grid.value.setBackgroundColor(value, null)
}
</script>

<template>
  <div>
    <ColorPicker
      :model-value="bgColor"
      :color-palette="colorPalette"
      icon="mdi-format-color-fill"
      @update:model-value="onUpdateBackgroundColor"
    />
  </div>
</template>
