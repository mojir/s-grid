<script setup lang="ts">
import { ref } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { ws } from '~/lib/utils'

const { grid } = useGrid()

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    ref="el"
    class="flex mt-[1px] flex-col overflow-x-auto dark:bg-blue-800 bg-blue-600 no-scrollbar"
    :style="ws(grid.rowHeaderWidth)"
  >
    <RowHeaderCell
      v-for="row of grid.rows"
      :key="row.id"

      :row="row"
    />
  </div>
</template>
