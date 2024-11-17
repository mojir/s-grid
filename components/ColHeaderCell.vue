<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { whs } from '~/lib/utils'
import { Col, type ColIdString, type ColRange } from '~/lib/Col'
import { CellRange } from '~/lib/CellRange'

const props = defineProps<{
  col: Col
}>()

const { col } = toRefs(props)

const { selection, isColSelected, selectedCols } = useSelection()
const { colHeaderHeight, rows } = useRowsAndCols()
const grid = useGrid()
const everthingSelected = computed(() => selection.value.equals(grid.value.gridRange.value))

function getAffectedRange(): ColRange {
  const selectedRange = selectedCols.value
  if (!selectedRange || !isColSelected(col.value.id.value)) {
    return { colIndex: col.value.index.value, count: 1 }
  }
  return selectedRange
}

function getAffectedColIds(): { start: ColIdString, end: ColIdString } {
  const { colIndex, count } = getAffectedRange()
  const start = Col.getColIdFromIndex(colIndex)
  const end = Col.getColIdFromIndex(colIndex + count - 1)
  return { start, end }
}

function getAffectedCols() {
  const selectedRange = selectedCols.value
  if (!selectedRange || selectedRange.count === 1 || !isColSelected(col.value.id.value)) {
    const range = CellRange.fromDimensions(0, col.value.index.value, rows.value.length - 1, col.value.index.value)
    return { start: col.value.id.value, end: col.value.id.value, count: 1, range }
  }

  const start = Col.getColIdFromIndex(selectedRange.colIndex)
  const end = Col.getColIdFromIndex(selectedRange.colIndex + selectedRange.count - 1)
  const range = CellRange.fromDimensions(0, selectedRange.colIndex, rows.value.length - 1, selectedRange.colIndex + selectedRange.count - 1)
  return { start: start, end: end, count: selectedRange.count, range }
}

const deleteColLabel = computed(() => {
  const { start, end } = getAffectedColIds()
  return start === end ? `Remove column ${start}` : `Remove columns ${start} - ${end}`
})

const insertBeforeColLabel = computed(() => {
  const { count } = getAffectedRange()
  if (count === 1) {
    return 'Insert 1 column before'
  }

  return `Insert ${count} columns before`
})

const insertAfterColLabel = computed(() => {
  const { count } = getAffectedRange()
  if (count === 1) {
    return 'Insert 1 column after'
  }

  return `Insert ${count} columns after`
})

function removeCol() {
  const { start, end } = getAffectedCols()
  grid.value.deleteCols(start, end)
}

function insertBeforeCol() {
  grid.value.insertColsBefore(getAffectedRange())
}

function insertAfterCol() {
  grid.value.insertColsAfter(getAffectedRange())
}

const hasSelectedCell = computed(() => selection.value.containsColIndex(col.value.index.value))
const isSelected = computed(() => isColSelected(col.value.id.value))

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
        :id="col.id.value"
        :style="whs(col.width.value, colHeaderHeight)"
        class="flex flex-1 justify-center text-xs items-center select-none"
      >
        {{ col.id.value }}
      </div>
      <div
        :id="`resize-col:${col.id.value}`"
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
