<script setup lang="ts">
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)
const grid = gridProject.value.currentGrid
const selection = grid.value.selection.selectedRange.value
const pressed = ref<boolean>()

watch(gridProject.value.clipboard.hasStyleData, (hasData) => {
  pressed.value = hasData
}, { immediate: true })

function onUpdatePressed(value: boolean) {
  if (value) {
    gridProject.value.clipboard.copyStyleSelection(selection)
  }
  else {
    gridProject.value.clipboard.clearStyleClipboard()
  }
}
</script>

<template>
  <Toggle
    variant="outline"
    :pressed="pressed"
    @update:pressed="onUpdatePressed"
  >
    <Icon
      name="mdi:format-paint"
      class="w-5 h-5"
    />
  </Toggle>
</template>
