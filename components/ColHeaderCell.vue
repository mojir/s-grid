<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { whs } from '~/lib/utils'
import { Col } from '~/lib/Col'

const props = defineProps<{
  col: Col
}>()

const { col } = toRefs(props)

const { selection, isColSelected, selectedCols, moveSelection } = useSelection()
const { colHeaderHeight } = useRowsAndCols()
const grid = useGrid()
const everthingSelected = computed(() => selection.value.equals(grid.value.gridRange.value))

function getAffectedCols() {
  const range = selectedCols.value
  if (!range || range.count === 1 || !isColSelected(col.value.id.value)) {
    return { start: col.value.id.value, end: col.value.id.value, count: 1 }
  }

  const start = Col.getColIdFromIndex(range.colIndex)
  const end = Col.getColIdFromIndex(range.colIndex + range.count - 1)
  return { start: start, end: end, count: range.count }
}

const deleteColLabel = computed(() => {
  const affextedCols = getAffectedCols()
  if (affextedCols.count === 1) {
    return 'Remove column'
  }

  const { start, end } = affextedCols
  return `Remove columns ${start} - ${end}`
})

const insertBeforeColLabel = computed(() => {
  const affextedCols = getAffectedCols()
  if (affextedCols.count === 1) {
    return 'Insert 1 column before'
  }

  return `Insert ${affextedCols.count} columns before`
})

const insertAfterColLabel = computed(() => {
  const affextedCols = getAffectedCols()
  if (affextedCols.count === 1) {
    return 'Insert 1 column after'
  }

  return `Insert ${affextedCols.count} columns after`
})

function removeCol() {
  const { start, end } = getAffectedCols()
  grid.value.deleteCols(start, end)
}

function insertBeforeCol() {
  const { start, count } = getAffectedCols()
  grid.value.insertColBefore(start, count)
}

function insertAfterCol() {
  const { end, count } = getAffectedCols()
  grid.value.insertColAfter(end, count)
  moveSelection({ rows: 0, cols: count })
  grid.value.position.value = selection.value.start
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
