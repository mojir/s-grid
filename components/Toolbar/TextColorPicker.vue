<script setup lang="ts">
import { colorPalette } from '~/lib/color'
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)
const grid = gridProject.value.currentGrid
</script>

<template>
  <div>
    <ColorPicker
      :model-value="grid.getTextColor(null)"
      :color-palette="colorPalette"
      icon="mdi-format-color-text"
      @update:model-value="grid.setTextColor($event, null)"
    />
  </div>
</template>
