<script setup lang="ts">
import { computed, toRefs, watch } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { whs } from '@/utils/cssUtils'
import { CellId } from '~/lib/CellId'
import type { Col } from '~/lib/Col'
import type { Row } from '~/lib/Row'

const props = defineProps<{
  row: Row
  col: Col
}>()

const emit = defineEmits<{
  (e: 'cell-dblclick', cellId: CellId): void
}>()

const { grid, activeCellId, selection } = useGrid()
const { editorFocused, editorText, editingCellId } = useEditor()

const { row, col } = toRefs(props)

const cellId = computed(() => CellId.fromCoords(row.value.index, col.value.index))
const isActiveCell = computed(() => activeCellId.value.equals(cellId.value))
const isInsideSelection = computed(
  () =>
    !isActiveCell.value
    && selection.value.contains(cellId.value),
)

const isSelectionTop = computed(
  () =>
    !isActiveCell.value
    && isInsideSelection.value
    && selection.value.isCellIdInTopRow(cellId.value),
)
const isSelectionBottom = computed(
  () =>
    !isActiveCell.value
    && isInsideSelection.value
    && selection.value.isCellIdInBottomRow(cellId.value),
)
const isSelectionLeft = computed(
  () =>
    !isActiveCell.value
    && isInsideSelection.value
    && selection.value.isCellIdInLeftColumn(cellId.value),
)
const isSelectionRight = computed(
  () =>
    !isActiveCell.value
    && isInsideSelection.value
    && selection.value.isCellIdInRightColumn(cellId.value))

const isEditingCell = computed(() => editorFocused.value && editingCellId.value.equals(cellId.value))
const cellContent = computed(() => {
  if (isEditingCell.value) {
    return editorText
  }
  return grid.value.getCell(cellId.value)?.displayValue
})
const hasContent = computed(() => !!cellContent.value || isEditingCell.value)

watch(activeCellId, () => {
  const cellElement = document.getElementById(activeCellId.value.id)
  cellElement?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  })
})
</script>

<template>
  <div
    :id="cellId.id"
    :style="whs(col.width, row.height)"
    class="flex box-border items-center text-sm whitespace-nowrap"
    :class="{
      'bg-none': !hasContent && !isInsideSelection,
      'dark:bg-slate-900 bg-gray-100': hasContent && !isInsideSelection,
      'dark:border-slate-800 border-gray-300 border-l-0 border-r border-b pl-[3px] pt-[1px] select-none': !isActiveCell,
      'dark:border-slate-500 border-gray-500 border pt-0 pl-[2px]': isActiveCell,
      'dark:bg-darkSelection bg-lightSelection  dark:border-b-slate-600 border-b-gray-400 dark:border-r-slate-600 border-r-gray-400': isInsideSelection,
      'dark:border-t-slate-700 border-t-gray-300 border-t pt-0': isSelectionTop,
      'dark:border-b-slate-700 border-b-gray-300 border-b': isSelectionBottom,
      'dark:border-l-slate-700 border-l-gray-300 border-l pl-[2px]': isSelectionLeft,
      'dark:border-r-slate-700 border-r-gray-300 border-r': isSelectionRight,
      'dark:bg-slate-950 bg-gray-50': isEditingCell,
    }"
    @dblclick="emit('cell-dblclick', cellId)"
  >
    {{ cellContent }}
  </div>
</template>
