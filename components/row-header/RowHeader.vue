<script setup lang="ts">
import { rowHeaderWidth } from '~/lib/constants'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)
</script>

<template>
  <div
    class="flex mt-[1px] flex-col overflow-x-auto dark:bg-blue-800 bg-blue-600 no-scrollbar"
    :style="ws(rowHeaderWidth)"
  >
    <RowHeaderCell
      v-for="row of grid.rows.value"
      :key="row.index.value"
      :project="project"
      :row="row"
    />
  </div>
</template>
