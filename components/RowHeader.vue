<script setup lang="ts">
import { ref } from 'vue'
import { rowHeaderWidth } from '~/lib/constants'
import { ws } from '~/lib/utils'

const grid = useCurrentGrid()

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
      :key="row.id.value"

      :row="row"
    />
  </div>
</template>
