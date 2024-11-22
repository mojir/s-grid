<script setup lang="ts">
import { ref } from 'vue'
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)
const grid = gridProject.value.currentGrid

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    ref="el"
    class="flex overflow-y-auto dark:bg-blue-800 bg-blue-600 no-scrollbar"
  >
    <ColHeaderCell
      v-for="col of grid.cols.value"
      :key="col.index.value"
      :grid-project="gridProject"
      :col="col"
    />
  </div>
</template>
