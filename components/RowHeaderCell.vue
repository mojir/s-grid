<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { rowHeaderWidth } from '~/lib/constants'
import { Row, type RowRange } from '~/lib/Row'
import { whs } from '~/lib/utils'

const props = defineProps<{
  row: Row
}>()

const { row } = toRefs(props)

const grid = useGrid()
const everthingSelected = computed(() => grid.value.selection.selectedRange.value.equals(grid.value.gridRange.value))

function getAffectedRange(): RowRange {
  const selectedRange = grid.value.selection.selectedRows.value
  if (!selectedRange || !grid.value.selection.isRowSelected(row.value.id.value)) {
    return { rowIndex: row.value.index.value, count: 1 }
  }
  return selectedRange
}

const deleteRowLabel = computed(() => {
  const { rowIndex, count } = getAffectedRange()
  const start = Row.getRowIdFromIndex(rowIndex)
  const end = Row.getRowIdFromIndex(rowIndex + count - 1)
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
  grid.value.deleteRows(getAffectedRange())
}

function insertBeforeRow() {
  grid.value.insertRowsBefore(getAffectedRange())
}

function insertAfterRow() {
  grid.value.insertRowsAfter(getAffectedRange())
}

const hasSelectedCell = computed(() => grid.value.selection.selectedRange.value.containsRowIndex(row.value.index.value))
const isSelected = computed(() => grid.value.selection.isRowSelected(row.value.id.value))

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
