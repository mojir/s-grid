<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { ref } from 'vue'
import { cssUtils } from '@/utils'

const { grid, fromCoordsToId } = useGrid()
const activeCellId = defineModel('activeCellId', {
  type: String,
  required: true,
})

const { dim } = cssUtils

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    class="overflow-auto"
    ref="el"
  >
    <div
      v-for="(row, i) of grid.rows"
      :key="row.id"
      :style="dim(null, row.height)"
      class="flex"
    >
      <div
        v-for="(col, j) of grid.cols"
        :key="col.id"
        :style="dim(col.width, row.height)"
        class="flex overflow-hidden box-border border-r border-b border-slate-800"
        :class="{
          'border-slate-500 border': fromCoordsToId(i, j) === activeCellId,
        }"
        @click="activeCellId = fromCoordsToId(i, j)"
      >
        {{ grid.cells[i][j]?.displayValue }}
      </div>
    </div>
  </div>
</template>
