<script setup lang="ts">
import { computed, toRefs, watch } from 'vue'
import { useGrid, type Col, type Row } from '@/composables/useGrid'
import { whs } from '@/utils/cssUtils'
import {
  fromIdToCoords,
  getSelectionFromId,
  getSelectionToId,
  insideSelection,
} from '@/utils/cellId'

const props = defineProps<{
  row: Row
  col: Col
}>()

const { grid, fromCoordsToId, activeCellId, selection } = useGrid()
const { editorFocused, editorText, editingCellId } = useEditor()

const { row, col } = toRefs(props)

const cellId = computed(() => fromCoordsToId(row.value.index, col.value.index))
const isActiveCell = computed(() => activeCellId.value === cellId.value)
const isInsideSelection = computed(
  () =>
    activeCellId.value !== selection.value
    && insideSelection(selection.value, cellId.value),
)

const rowId = computed(() => fromIdToCoords(cellId.value)[0])
const colId = computed(() => fromIdToCoords(cellId.value)[1])
const selectionFromRow = computed(
  () => fromIdToCoords(getSelectionFromId(selection.value))[0],
)
const selectionFromCol = computed(
  () => fromIdToCoords(getSelectionFromId(selection.value))[1],
)
const selectionToRow = computed(
  () => fromIdToCoords(getSelectionToId(selection.value))[0],
)
const selectionToCol = computed(
  () => fromIdToCoords(getSelectionToId(selection.value))[1],
)

const isSelectionTop = computed(
  () =>
    !isActiveCell.value
    && isInsideSelection.value
    && rowId.value === selectionFromRow.value,
)
const isSelectionBottom = computed(
  () =>
    !isActiveCell.value
    && isInsideSelection.value
    && rowId.value === selectionToRow.value,
)
const isSelectionLeft = computed(
  () =>
    !isActiveCell.value
    && isInsideSelection.value
    && colId.value === selectionFromCol.value,
)
const isSelectionRight = computed(
  () =>
    !isActiveCell.value
    && isInsideSelection.value
    && colId.value === selectionToCol.value,
)

const isEditingCell = computed(() => editorFocused.value && editingCellId.value === cellId.value)
const cellContent = computed(() => {
  if (isEditingCell.value) {
    return editorText
  }
  return grid.value.getCell(cellId.value)?.displayValue
})
const hasContent = computed(() => !!cellContent.value || isEditingCell.value)

const emit = defineEmits<{
  (e: 'cell-dblclick' | 'cell-click', id: string): void
}>()

watch(activeCellId, () => {
  const cellElement = document.getElementById(activeCellId.value)
  cellElement?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  })
})
</script>

<template>
  <div
    :id="cellId"
    :style="whs(col.width, row.height)"
    class="flex box-border items-center text-sm"
    :class="{
      'bg-slate-900': hasContent,
      'border-slate-800 border-l-0 border-r border-b pl-[3px] pt-[1px]': !isActiveCell,
      'border-slate-500 border pt-0 pl-[2px]': isActiveCell,
      'bg-[rgba(29,37,58,.9)]': isInsideSelection,
      'border-t-slate-700 border-t pt-0': isSelectionTop,
      'border-b-slate-700 border-b': isSelectionBottom,
      'border-l-slate-700 border-l pl-[2px]': isSelectionLeft,
      'border-r-slate-700 border-r': isSelectionRight,
      'bg-slate-950': isEditingCell,
    }"
    @click="emit('cell-click', cellId)"
    @dblclick="emit('cell-dblclick', cellId)"
  >
    {{ cellContent }}
  </div>
</template>
