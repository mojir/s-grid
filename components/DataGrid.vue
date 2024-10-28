<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { ref, watch } from 'vue'
import { hs } from '@/utils/cssUtils'
import GridCell from './GridCell.vue'

const emit = defineEmits<{
  (e: 'cell-dblclick' | 'cell-click', id: string): void
}>()

const { grid, activeCellId } = useGrid()

watch(activeCellId, () => {
  const cellElement = document.getElementById(activeCellId.value)
  cellElement?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  })
})

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    ref="el"
    class="overflow-auto"
  >
    <div
      v-for="row of grid.rows"
      :key="row.label"
      :style="hs(row.height)"
      class="flex"
    >
      <div
        v-for="col of grid.cols"
        :key="col.label"
      >
        <GridCell
          :row="row"
          :col="col"
          @cell-click="emit('cell-click', $event)"
          @cell-dblclick="emit('cell-dblclick', $event)"
        />
      </div>
    </div>
  </div>
</template>
