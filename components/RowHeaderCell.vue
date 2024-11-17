<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { Row, type RowIdString, type RowRange } from '~/lib/Row'
import { whs } from '~/lib/utils'

const props = defineProps<{
  row: Row
}>()

const { row } = toRefs(props)

const { rowHeaderWidth } = useRowsAndCols()
const { selection, isRowSelected, selectedRows } = useSelection()
const grid = useGrid()
const everthingSelected = computed(() => selection.value.equals(grid.value.gridRange.value))

function getAffectedRange(): RowRange {
  const selectedRange = selectedRows.value
  if (!selectedRange || !isRowSelected(row.value.id.value)) {
    // const range = CellRange.fromDimensions(row.value.index.value, 0, row.value.index.value, cols.value.length - 1)
    return { rowIndex: row.value.index.value, count: 1 }
  }
  return selectedRange
}

function getAffectedRowIds(): { start: RowIdString, end: RowIdString } {
  const { rowIndex, count } = getAffectedRange()
  const start = Row.getRowIdFromIndex(rowIndex)
  const end = Row.getRowIdFromIndex(rowIndex + count - 1)
  return { start, end }
}

const deleteRowLabel = computed(() => {
  const { start, end } = getAffectedRowIds()
  return start === end ? `Remove row ${start}` : `Remove rows ${start} - ${end}`
})

const insertBeforeRowLabel = computed(() => {
  const { count } = getAffectedRange()
  if (count === 1) {
    return 'Insert 1 row before'
  }

  return `Insert ${count} rows before`
})

const insertAfterRowLabel = computed(() => {
  const { count } = getAffectedRange()
  if (count === 1) {
    return 'Insert 1 row after'
  }

  return `Insert ${count} rows after`
})

function removeRow() {
  const { start, end } = getAffectedRowIds()
  grid.value.deleteRows(start, end)
}

function insertBeforeRow() {
  grid.value.insertRowsBefore(getAffectedRange())
}

function insertAfterRow() {
  grid.value.insertRowsAfter(getAffectedRange())
}

const hasSelectedCell = computed(() => selection.value.containsRowIndex(row.value.index.value))
const isSelected = computed(() => isRowSelected(row.value.id.value))

const cellStyle = computed(() => {
  const style: CSSProperties = {
    width: `${rowHeaderWidth}px`,
    height: `${row.value.height.value + 1}px`,
    marginTop: '-1px',
    color: isSelected.value ? 'var(--background)' : 'hsl(var(--foreground))',
    backgroundColor: isSelected.value
      ? 'var(--is-selected-header-background-color)'
      : hasSelectedCell.value
        ? 'var(--has-selected-cell-header-background-color)'
        : 'var(--header-background-color)',
    borderColor: 'var(--header-border-color)',
    borderStyle: 'solid',
    borderTopWidth: row.value.index.value !== 0 ? '1px' : '0px',
    borderBottomWidth: '1px',
    borderRightWidth: '1px',
  }
  return style
})
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger
      :style="cellStyle"
      class="flex flex-col box-border"
    >
      <div
        :id="row.id.value"
        :style="whs(rowHeaderWidth, row.height.value)"
        class="flex justify-center items-center text-xs select-none"
      >
        {{ row.id.value }}
      </div>
      <div
        :id="`resize-row:${row.id.value}`"
        :style="whs(rowHeaderWidth, 5)"
        class="bg-transparent mt-[-3px] z-10 cursor-row-resize"
      />
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        :disabled="everthingSelected"
        @click="removeRow"
      >
        <Icon
          name="mdi-trash-can-outline"
          class="w-4 h-4"
        />
        {{ deleteRowLabel }}
      </ContextMenuItem>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="insertBeforeRow"
      >
        <Icon
          name="mdi-plus"
          class="w-4 h-4"
        />
        {{ insertBeforeRowLabel }}
      </ContextMenuItem>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="insertAfterRow"
      >
        <Icon
          name="mdi-plus"
          class="w-4 h-4"
        />
        {{ insertAfterRowLabel }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
