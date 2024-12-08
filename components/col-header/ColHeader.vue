<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)
</script>

<template>
  <div class="flex overflow-y-auto dark:bg-blue-800 bg-blue-600 no-scrollbar">
    <ColHeaderCell
      v-for="col of grid.cols.value"
      :key="col.index.value"
      :project="project"
      :col="col"
    />
  </div>
</template>
