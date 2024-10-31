<script setup lang="ts">
import { ref } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { ws } from '@/utils/cssUtils'

const { grid } = useGrid()

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    ref="el"
    class="flex flex-col overflow-x-auto dark:bg-slate-800 bg-gray-200 no-scrollbar"
    :style="ws(grid.rowHeaderWidth)"
  >
    <RowHeaderCell
      v-for="row of grid.rows"
      :key="row.id"

      :row="row"
    />
  </div>
</template>
