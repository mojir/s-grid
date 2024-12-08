<script setup lang="ts">
import { colorPalette } from '~/lib/color'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)
</script>

<template>
  <div>
    <ColorPicker
      :model-value="grid.getBackgroundColor(null)"
      :color-palette="colorPalette"
      icon="mdi-format-color-fill"
      @update:model-value="grid.setBackgroundColor($event, null)"
    />
  </div>
</template>
