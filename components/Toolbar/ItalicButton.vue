<script setup lang="ts">
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)
const grid = gridProject.value.currentGrid
const italic = ref<boolean>()

watch(grid.value.selection.selectedRange, (newSelection) => {
  italic.value = grid.value.getStyle('italic', newSelection) ?? undefined
}, { immediate: true })

function onUpdateItalic(value: boolean) {
  grid.value.setStyle('italic', value)
  italic.value = value
}
</script>

<template>
  <Toggle
    variant="outline"
    :pressed="italic"
    @update:pressed="onUpdateItalic"
  >
    <Icon
      name="mdi:format-italic"
      class="w-5 h-5"
    />
  </Toggle>
</template>
