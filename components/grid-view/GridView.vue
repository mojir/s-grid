<script setup lang="ts">
import { watch } from 'vue'
import { hs } from '~/lib/utils'
import type { Project } from '~/lib/project/Project'
import type { CellLocator } from '~/lib/locators/CellLocator'
import { getDocumentCellId, getDocumentColId, getDocumentRowId } from '~/lib/locators/utils'
import { ColLocator } from '~/lib/locators/ColLocator'
import { RowLocator } from '~/lib/locators/RowLocator'

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  (e: 'cell-dblclick', cellLocator: CellLocator): void
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const referencedLocators = computed(() => {
  return grid.value.currentCell.value.localReferenceLocators.value.filter((locator) => {
    return locator.gridName === grid.value.name.value
  })
})
watch(grid.value.position, (position) => {
  const cellElement = document.getElementById(getDocumentCellId(position))
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
  let element: HTMLElement | null = null
  if (oldRange.size() > 1 || newRange.size() === 2) {
    if (oldStart.row !== newStart.row) {
      const row = newStart.row > oldStart.row
        ? (newStart.row < grid.value.rows.value.length - 1 ? newStart.row + 1 : newStart.row)
        : (newStart.row > 0 ? newStart.row - 1 : newStart.row)

      const rowLocator = RowLocator.fromNumber(grid.value.name.value, row)
      element = document.getElementById(getDocumentRowId(rowLocator))
    }
    else if (oldStart.col !== newStart.col) {
      const col = newStart.col > oldStart.col
        ? (newStart.col < grid.value.cols.value.length - 1 ? newStart.col + 1 : newStart.col)
        : (newStart.col > 0 ? newStart.col - 1 : newStart.col)

      const colLocator = ColLocator.fromNumber(grid.value.name.value, col)
      element = document.getElementById(getDocumentColId(colLocator))
    }
    else if (oldEnd.row !== newEnd.row) {
      const row = newEnd.row > oldEnd.row
        ? (newEnd.row < grid.value.rows.value.length - 1 ? newEnd.row + 1 : newEnd.row)
        : (newEnd.row > 0 ? newEnd.row - 1 : newEnd.row)

      const rowLocator = RowLocator.fromNumber(grid.value.name.value, row)
      element = document.getElementById(getDocumentRowId(rowLocator))
    }
    else if (oldEnd.col !== newEnd.col) {
      const col = newEnd.col > oldEnd.col
        ? (newEnd.col < grid.value.cols.value.length - 1 ? newEnd.col + 1 : newEnd.col)
        : (newEnd.col > 0 ? newEnd.col - 1 : newEnd.col)

      const colLocator = ColLocator.fromNumber(grid.value.name.value, col)
      element = document.getElementById(getDocumentColId(colLocator))
    }
    element?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    })
  }
})
</script>

<template>
  <div class="pl-[1px] pt-[1px] overflow-auto relative bg-grid">
    <GridViewMenu :project="project">
      <div
        v-for="row of grid.rows.value"
        :key="row.index.value"
        :style="hs(row.height.value)"
        class="flex"
        :class="{ 'cursor-crosshair': grid.editor.editingLitsCode.value }"
      >
        <div
          v-for="col of grid.cols.value"
          :key="col.index.value"
        >
          <CellView
            :row="row"
            :col="col"
            :project="project"
            @cell-dblclick="emit('cell-dblclick', $event)"
          />
        </div>
      </div>
    </gridViewMenu>

    <GridRegion
      :grid="grid"
      :region="grid.position"
      class="border-2 border-cell-border"
    />
    <GridRegion
      v-if="grid.selection.selectedRange.value.size() > 1"
      :grid="grid"
      :region="grid.selection.selectedRange"
      class="border border-cell-border bg-selected-cell"
    />
    <div
      v-if="grid.editor.editing.value"
    >
      <GridRegion
        v-for="region of referencedLocators"
        :key="region.toStringWithoutGrid()"
        :grid="grid"
        :region="ref(region)"
        class="bg-referenced-cell"
      />
    </div>
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
