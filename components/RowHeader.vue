<script setup lang="ts">
import { ref } from 'vue'
import { ws } from '~/lib/utils'

const { rows, rowHeaderWidth } = useRowsAndCols()

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
      v-for="row of rows"
      :key="row.id.value"

      :row="row"
    />
  </div>
</template>
