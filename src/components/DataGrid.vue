<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { ref } from 'vue'
import { cssUtils } from '@/utils'

const emit = defineEmits<{
  (e: 'cell-dblclick', id: string): void
}>()

const { grid, fromCoordsToId, activeCellId } = useGrid()

const { wh, h } = cssUtils

const el = ref<HTMLDivElement>()

function onClick(id: string) {
  activeCellId.value = id
}
function onDblClick(id: string) {
  emit('cell-dblclick', id)
}

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
      :style="h(row.height)"
      class="flex"
    >
      <div
        v-for="(col, j) of grid.cols"
        :key="col.id"
        :style="wh(col.width, row.height)"
        class="flex overflow-hidden box-border border-r border-b pl-[3px] pt-[1px] border-slate-800 items-center"
        :class="{
          'border-slate-400 border pt-0 pl-[2px]':
            fromCoordsToId(i, j) === activeCellId,
        }"
        @click="onClick(fromCoordsToId(i, j))"
        @dblclick="onDblClick(fromCoordsToId(i, j))"
      >
        {{ grid.cells[i][j]?.displayValue }}
      </div>
    </div>
  </div>
</template>
