<script setup lang="ts">
import { ref, watch } from 'vue'
import GridCell from './GridCell.vue'
import { hs } from '~/lib/utils'
import type { GridProject } from '~/lib/GridProject'
import type { CellLocator } from '~/lib/locator/CellLocator'
import { getDocumentCellId } from '~/lib/locator/utils'

const props = defineProps<{
  gridProject: GridProject
}>()

const emit = defineEmits<{
  (e: 'cell-dblclick', cellLocator: CellLocator): void
}>()

const { gridProject } = toRefs(props)
const grid = computed(() => gridProject.value.currentGrid.value)

watch(grid.value.position, (position) => {
  const cellElement = document.getElementById(getDocumentCellId(position, grid.value.name.value))
  cellElement?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  })
})

watch(grid.value.selection.selectedRange, (newRange, oldRange) => {
  const newStart = newRange.start
  const newEnd = newRange.end
  const oldStart = oldRange.start
  const oldEnd = oldRange.end

  // Avoid scrolling if a row or column is selected
  if (oldRange.size() > 1 || newRange.size() === 2) {
    if (oldStart.row !== newStart.row || oldStart.col !== newStart.col) {
      const cellElement = document.getElementById(getDocumentCellId(newStart, grid.value.name.value))
      cellElement?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    }

    if (oldEnd.row !== newEnd.row || oldEnd.col !== newEnd.col) {
      const cellElement = document.getElementById(getDocumentCellId(newEnd, grid.value.name.value))
      cellElement?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }
})

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    ref="el"
    class="pl-[1px] pt-[1px] overflow-auto relative bg-grid"
  >
    <!-- <GridRegion
      v-if="grid.selection.selectedRange.value.size() > 1"
      :grid="grid"
      :region="grid.selection.selectedRange"
      class="bg-selected-cell"
    /> -->

    <GridContextMenu :grid-project="gridProject">
      <div
        v-for="row of grid.rows.value"
        :key="row.index.value"
        :style="hs(row.height.value)"
        class="flex"
      >
        <div
          v-for="col of grid.cols.value"
          :key="col.index.value"
        >
          <GridCell
            :row="row"
            :col="col"
            :grid-project="gridProject"
            @cell-dblclick="emit('cell-dblclick', $event)"
          />
        </div>
      </div>
    </GridContextMenu>
    <GridRegion
      v-if="grid.selection.selectedRange.value.size() > 1"
      :grid="grid"
      :region="grid.selection.selectedRange"
      class="border border-cell-border bg-selected-cell"
    />
    <GridRegion
      :grid="grid"
      :region="grid.position"
      class="border-2 border-cell-border"
    />
    <GridRegion
      v-if="grid.editor.editing.value"
      active
      :grid="grid"
      :region="grid.position"
    >
      <CellInput :grid="grid" />
    </GridRegion>
  </div>
</template>
