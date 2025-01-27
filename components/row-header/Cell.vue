<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { rowHeaderWidth } from '~/lib/constants'
import type { Row } from '~/lib/Row'
import type { Project } from '~/lib/project/Project'
import { getDocumentResizeRowId, getDocumentRowId } from '~/lib/reference/utils'
import { RangeReference } from '~/lib/reference/RangeReference'

const props = defineProps<{
  project: Project
  row: Row
}>()

const { row, project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const everthingSelected = computed(() => grid.value.selection.selectedRange.value.equals(grid.value.gridRange.value))

const rowId = computed(() => getDocumentRowId(grid.value, row.value.index.value))
const resizeRowId = computed(() => getDocumentResizeRowId(grid.value, row.value.index.value))

const deleteRowLabel = computed(() => {
  const rangeReference = getAffectedRange()
  const rowIndex = rangeReference.start.rowIndex
  const count = rangeReference.rowCount()
  const startRowId = getRowId(rowIndex)
  const endRowId = getRowId(rowIndex + count - 1)
  return startRowId === endRowId ? `Remove row ${startRowId}` : `Remove rows ${startRowId} - ${endRowId}`
})

const insertBeforeRowLabel = computed(() => {
  const count = getAffectedRange().rowCount()
  if (count === 1) {
    return 'Insert 1 row before'
  }

  return `Insert ${count} rows before`
})

const insertAfterRowLabel = computed(() => {
  const count = getAffectedRange().rowCount()
  if (count === 1) {
    return 'Insert 1 row after'
  }

  return `Insert ${count} rows after`
})

function getAffectedRange(): RangeReference {
  const selectedRange = grid.value.selection.selectedRows.value
  if (!selectedRange || !grid.value.selection.isRowSelected(row.value.index.value)) {
    return RangeReference.fromRowIndex(grid.value, row.value.index.value)
  }
  return selectedRange
}

function removeRow() {
  const { start, end } = getAffectedRange()
  grid.value.deleteRows(start.rowIndex, end.rowIndex - start.rowIndex + 1)
}

function insertBeforeRow() {
  const { start, end } = getAffectedRange()
  grid.value.insertRowsBefore(start.rowIndex, end.rowIndex - start.rowIndex + 1)
}

function insertAfterRow() {
  const { start, end } = getAffectedRange()
  grid.value.insertRowsAfter(start.rowIndex, end.rowIndex - start.rowIndex + 1)
}

const hasSelectedCell = computed(() => grid.value.selection.selectedRange.value.containsRowIndex(row.value.index.value))
const isSelected = computed(() => grid.value.selection.isRowSelected(row.value.index.value))

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
        :id="rowId"
        :style="whs(rowHeaderWidth, row.height.value)"
        class="flex justify-center items-center text-xs select-none"
      >
        {{ row.label.value }}
      </div>
      <div
        :id="resizeRowId"
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
