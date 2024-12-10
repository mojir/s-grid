<script setup lang="ts">
import { watch, type WatchHandle } from 'vue'
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
watch(grid.value.position, (newPosition) => {
  project.value.locator.getSurroundingCorners(newPosition, grid.value.gridRange.value)
    .map(locator => document.getElementById(getDocumentCellId(locator)))
    .forEach(element => element?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    }))
})

let handle: WatchHandle
watch(grid, (grid) => {
  if (handle) {
    handle.stop()
  }
  handle = watch(grid.selection.selectedRange, (newRange, oldRange) => {
    if (grid.selection.isScollDisabled()) {
      return
    }

    const newStart = newRange.start
    const newEnd = newRange.end
    const oldStart = oldRange.start
    const oldEnd = oldRange.end

    const elements: (HTMLElement | null)[] = []

    // TODO implement and use getSurroundingRows from Locator
    // or even better, getSurroundingCorners from A cellLocator
    if (oldStart.row !== newStart.row) {
      elements.push(...[
        Math.max(newStart.row - 2, 0),
        Math.min(newStart.row + 2, grid.rows.value.length - 1),
      ]
        .map(row => RowLocator.fromNumber(grid.name.value, row))
        .map(getDocumentRowId)
        .map(id => document.getElementById(id)))
    }
    else if (oldStart.col !== newStart.col) {
      elements.push(...[
        Math.max(newStart.col - 1, 0),
        Math.min(newStart.col + 1, grid.cols.value.length - 1),
      ]
        .map(col => ColLocator.fromNumber(grid.name.value, col))
        .map(getDocumentColId)
        .map(id => document.getElementById(id)))
    }
    else if (oldEnd.row !== newEnd.row) {
      elements.push(...[
        Math.max(newEnd.row - 2, 0),
        Math.min(newEnd.row + 2, grid.rows.value.length - 1),
      ]
        .map(row => RowLocator.fromNumber(grid.name.value, row))
        .map(getDocumentRowId)
        .map(id => document.getElementById(id)))
    }
    else if (oldEnd.col !== newEnd.col) {
      elements.push(...[
        Math.max(newEnd.col - 1, 0),
        Math.min(newEnd.col + 1, grid.cols.value.length - 1),
      ]
        .map(col => ColLocator.fromNumber(grid.name.value, col))
        .map(getDocumentColId)
        .map(id => document.getElementById(id)))
    }
    elements.forEach(element => element?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
  })
}, { immediate: true })
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
