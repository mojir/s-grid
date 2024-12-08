<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { getColId, whs } from '~/lib/utils'
import type { Col } from '~/lib/Col'
import { colHeaderHeight } from '~/lib/constants'
import type { Project } from '~/lib/project/Project'
import { ColLocator } from '~/lib/locators/ColLocator'
import { getDocumentColId, getDocumentResizeColId } from '~/lib/locators/utils'
import { ColRangeLocator } from '~/lib/locators/ColRangeLocator'

const props = defineProps<{
  project: Project
  col: Col
}>()

const { col, project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)
const gridName = computed(() => grid.value.name.value)

const everthingSelected = computed(() => grid.value.selection.selectedRange.value.equals(grid.value.gridRange.value))

const colLocator = computed(() => ColLocator.fromNumber(gridName.value, col.value.index.value))
const colId = computed(() => getDocumentColId(colLocator.value))
const resizeColId = computed(() => getDocumentResizeColId(colLocator.value))

function getAffectedRange(): ColRangeLocator {
  const selectedRange = grid.value.selection.selectedCols.value
  if (!selectedRange || !grid.value.selection.isColSelected(col.value.index.value)) {
    return ColRangeLocator.fromColLocator(colLocator.value)
  }
  return selectedRange
}

const deleteColLabel = computed(() => {
  const colRangeLocator = getAffectedRange()
  const col = colRangeLocator.start.col
  const count = colRangeLocator.size()
  const start = getColId(col)
  const end = getColId(col + count - 1)
  return start === end ? `Remove column ${start}` : `Remove columns ${start} - ${end}`
})

const insertBeforeColLabel = computed(() => {
  const count = getAffectedRange().size()
  if (count === 1) {
    return 'Insert 1 column before'
  }

  return `Insert ${count} columns before`
})

const insertAfterColLabel = computed(() => {
  const count = getAffectedRange().size()
  if (count === 1) {
    return 'Insert 1 column after'
  }

  return `Insert ${count} columns after`
})

function removeCol() {
  grid.value.deleteCols(getAffectedRange())
}

function insertBeforeCol() {
  grid.value.insertColsBefore(getAffectedRange())
}

function insertAfterCol() {
  grid.value.insertColsAfter(getAffectedRange())
}

const hasSelectedCell = computed(() => grid.value.selection.selectedRange.value.containsCol(col.value.index.value))
const isSelected = computed(() => grid.value.selection.isColSelected(col.value.index.value))

const cellStyle = computed(() => {
  const style: CSSProperties = {
    height: `${colHeaderHeight}px`,
    width: `${col.value.width.value + 1}px`,
    minHeight: `${colHeaderHeight}px`,
    minWidth: `${col.value.width.value + 1}px`,
    marginLeft: '-1px',
    color: isSelected.value ? 'var(--background)' : 'hsl(var(--foreground))',
    backgroundColor: isSelected.value
      ? 'var(--is-selected-header-background-color)'
      : hasSelectedCell.value
        ? 'var(--has-selected-cell-header-background-color)'
        : 'var(--header-background-color)',
    borderColor: 'var(--header-border-color)',
    borderStyle: 'solid',
    borderLeftWidth: col.value.index.value !== 0 ? '1px' : '0px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
  }
  return style
})
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger
      :style="cellStyle"
      class="flex"
    >
      <div
        :id="colId"
        :style="whs(col.width.value, colHeaderHeight)"
        class="flex flex-1 justify-center text-xs items-center select-none"
      >
        {{ col.label.value }}
      </div>
      <div
        :id="resizeColId"
        :style="whs(5, colHeaderHeight)"
        class="bg-transparent ml-[-3px] z-10 cursor-col-resize"
      />
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        :disabled="everthingSelected"
        @click="removeCol"
      >
        <Icon
          name="mdi-trash-can-outline"
          class="w-4 h-4"
        />
        {{ deleteColLabel }}
      </ContextMenuItem>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="insertBeforeCol"
      >
        <Icon
          name="mdi-plus"
          class="w-4 h-4"
        />
        {{ insertBeforeColLabel }}
      </ContextMenuItem>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="insertAfterCol"
      >
        <Icon
          name="mdi-plus"
          class="w-4 h-4"
        />
        {{ insertAfterColLabel }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
