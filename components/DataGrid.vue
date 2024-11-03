<script setup lang="ts">
import { ref, watch } from 'vue'
import GridCell from './GridCell.vue'
import { useGrid } from '@/composables/useGrid'
import { hs } from '@/utils/cssUtils'
import type { CellId } from '~/lib/CellId'

const emit = defineEmits<{
  (e: 'cell-dblclick', cellId: CellId): void
}>()

const { grid } = useGrid()

watch(grid.value.position, (position) => {
  const cellElement = document.getElementById(position.id)
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
    class="pl-[1px] pt-[1px] overflow-auto"
  >
    <div
      v-for="row of grid.rows"
      :key="row.id"
      :style="hs(row.height.value)"
      class="flex"
    >
      <div
        v-for="col of grid.cols"
        :key="col.id"
        class="dark:bg-blue-700 bg-blue-200"
      >
        <GridCell
          :row="row"
          :col="col"
          @cell-dblclick="emit('cell-dblclick', $event)"
        />
      </div>
    </div>
  </div>
</template>
