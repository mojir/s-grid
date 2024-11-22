<script setup lang="ts">
import { ref } from 'vue'
import { rowHeaderWidth } from '~/lib/constants'
import { ws } from '~/lib/utils'
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
    class="flex mt-[1px] flex-col overflow-x-auto dark:bg-blue-800 bg-blue-600 no-scrollbar"
    :style="ws(rowHeaderWidth)"
  >
    <RowHeaderCell
      v-for="row of grid.rows.value"
      :key="row.index.value"
      :grid-project="gridProject"
      :row="row"
    />
  </div>
</template>
