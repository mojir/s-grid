<script setup lang="ts">
import { watch, type WatchHandle } from 'vue'
import { hs } from '~/lib/utils'
import type { Project } from '~/lib/project/Project'
import type { CellLocator } from '~/lib/locators/CellLocator'
import { getDocumentCellId, getDocumentColId, getDocumentRowId } from '~/lib/locators/utils'

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
    return locator.grid === grid.value
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

    if (oldStart.row !== newStart.row) {
      elements.push(...project.value.locator.getSurroundingRows(newStart, grid.gridRange.value)
        .map(locator => document.getElementById(getDocumentRowId(locator))))
    }
    else if (oldStart.col !== newStart.col) {
      elements.push(...project.value.locator.getSurroundingCols(newStart, grid.gridRange.value)
        .map(locator => document.getElementById(getDocumentColId(locator))))
    }
    else if (oldEnd.row !== newEnd.row) {
      elements.push(...project.value.locator.getSurroundingRows(newEnd, grid.gridRange.value)
        .map(locator => document.getElementById(getDocumentRowId(locator))))
    }
    else if (oldEnd.col !== newEnd.col) {
      elements.push(...project.value.locator.getSurroundingCols(newEnd, grid.gridRange.value)
        .map(locator => document.getElementById(getDocumentColId(locator))))
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
      v-if="grid.selection.selectedRange.value.size.value > 1"
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
        :region="shallowRef(region)"
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
