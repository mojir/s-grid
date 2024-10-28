<script setup lang="ts">
import { useGrid, type Col, type Row } from '@/composables/useGrid'
import { wh } from '@/utils/cssUtils'
import {
  fromIdToCoords,
  getSelectionFromId,
  getSelectionToId,
  insideSelection,
} from '@/utils/cellId'
import { computed, toRefs, watch } from 'vue'

const props = defineProps<{
  row: Row
  col: Col
}>()

const { grid, fromCoordsToId, activeCellId, selection } = useGrid()

const { row, col } = toRefs(props)

const cellId = computed(() => fromCoordsToId(row.value.index, col.value.index))
const isActiveCell = computed(() => activeCellId.value === cellId.value)
const isInsideSelection = computed(
  () =>
    activeCellId.value !== selection.value &&
    insideSelection(selection.value, cellId.value),
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
    !isActiveCell.value &&
    isInsideSelection.value &&
    rowId.value === selectionFromRow.value,
)
const isSelectionBottom = computed(
  () =>
    !isActiveCell.value &&
    isInsideSelection.value &&
    rowId.value === selectionToRow.value,
)
const isSelectionLeft = computed(
  () =>
    !isActiveCell.value &&
    isInsideSelection.value &&
    colId.value === selectionFromCol.value,
)
const isSelectionRight = computed(
  () =>
    !isActiveCell.value &&
    isInsideSelection.value &&
    colId.value === selectionToCol.value,
)

const emit = defineEmits<{
  (e: 'cell-dblclick', id: string): void
  (e: 'cell-click', id: string): void
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
    :style="wh(col.width, row.height)"
    :id="cellId"
    class="flex overflow-hidden box-border border-r border-b pl-[3px] pt-[1px] border-slate-800 items-center text-sm"
    :class="{
      'border-slate-400 border pt-0 pl-[2px]': isActiveCell,
      'bg-[rgba(29,37,58,.9)]': isInsideSelection,
      'border-t-slate-700 border-t pt-0': isSelectionTop,
      'border-b-slate-700 border-b': isSelectionBottom,
      'border-l-slate-700 border-l pl-[2px]': isSelectionLeft,
      'border-r-slate-700 border-r': isSelectionRight,
    }"
    @click="emit('cell-click', cellId)"
    @dblclick="emit('cell-dblclick', cellId)"
  >
    <!-- {{ isSelectionBottom }} -->
    {{ grid.getCell(cellId)?.displayValue }}
  </div>
</template>
