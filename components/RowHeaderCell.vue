<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { whs } from '~/lib/utils'
import { Row } from '~/lib/Row'

const props = defineProps<{
  row: Row
}>()

const { row } = toRefs(props)

const { rowHeaderWidth } = useRowsAndCols()
const { selection, isRowSelected, selectedRows, moveSelection } = useSelection()
const grid = useGrid()
const everthingSelected = computed(() => selection.value.equals(grid.value.gridRange.value))

function getAffectedRows() {
  const range = selectedRows.value
  if (!range || range.count === 1 || !isRowSelected(row.value.id.value)) {
    return { start: row.value.id.value, end: row.value.id.value, count: 1 }
  }

  const start = Row.getRowIdFromIndex(range.rowIndex)
  const end = Row.getRowIdFromIndex(range.rowIndex + range.count - 1)
  return { start: start, end: end, count: range.count }
}

const deleteRowLabel = computed(() => {
  const affextedRows = getAffectedRows()
  if (affextedRows.count === 1) {
    return 'Remove row'
  }

  const { start, end } = affextedRows
  return `Remove rows ${start} - ${end}`
})

const insertBeforeRowLabel = computed(() => {
  const affextedRows = getAffectedRows()
  if (affextedRows.count === 1) {
    return 'Insert 1 row before'
  }

  return `Insert ${affextedRows.count} rows before`
})

const insertAfterRowLabel = computed(() => {
  const affextedRows = getAffectedRows()
  if (affextedRows.count === 1) {
    return 'Insert 1 row after'
  }

  return `Insert ${affextedRows.count} rows after`
})

function removeRow() {
  const { start, end } = getAffectedRows()
  grid.value.deleteRows(start, end)
}

function insertBeforeRow() {
  const { start, count } = getAffectedRows()
  grid.value.insertRowBefore(start, count)
}

function insertAfterRow() {
  const { end, count } = getAffectedRows()
  grid.value.insertRowAfter(end, count)
  moveSelection({ rows: count, cols: 0 })
  grid.value.position.value = selection.value.start
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
