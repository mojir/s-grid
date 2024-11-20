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
      :model-value="grid.getBackgroundColor()"
      :color-palette="colorPalette"
      icon="mdi-format-color-fill"
      @update:model-value="grid.setBackgroundColor($event)"
    />
  </div>
</template>
