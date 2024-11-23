<script setup lang="ts">
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)
const grid = gridProject.value.currentGrid
const bold = ref<boolean>()

watch(grid.value.selection.selectedRange, (newSelection) => {
  bold.value = grid.value.getStyle('bold', newSelection)
}, { immediate: true })

function onUpdateBold(value: boolean) {
  grid.value.setStyle('bold', value, null)
  bold.value = value
}
</script>

<template>
  <Toggle
    variant="outline"
    :pressed="bold"
    @update:pressed="onUpdateBold"
  >
    <Icon
      name="mdi:format-bold"
      class="w-5 h-5"
    />
  </Toggle>
</template>
