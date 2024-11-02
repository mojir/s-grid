<script setup lang="ts">
import { computed, toRefs, watch, type CSSProperties } from 'vue'
import { useGrid } from '@/composables/useGrid'
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

const { grid } = useGrid()
const { editorFocused, editorText, editingCellId } = useEditor()
const { currentTab, sidePanelOpen } = useSidePanel()
const { run } = useREPL()
const { debugMode } = useDebug()

const { row, col } = toRefs(props)

const cellId = computed(() => CellId.fromCoords(row.value.index, col.value.index))
const cell = computed(() => grid.value.getCell(cellId.value))
const isActiveCell = computed(() => grid.value.activeCellId.value.equals(cellId.value))
const isInsideSelection = computed(
  () =>
    grid.value.selection.value.size() > 1 && grid.value.selection.value.contains(cellId.value),
)

const isEditingCell = computed(() => editorFocused.value && editingCellId.value.equals(cellId.value))
const cellContent = computed(() => {
  if (isEditingCell.value) {
    return editorText
  }
  return grid.value.getCell(cellId.value)?.displayValue
})

watch(grid.value.activeCellId, (activeCellId) => {
  const cellElement = document.getElementById(activeCellId.id)
  cellElement?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  })
})

const cellStyle = computed(() => {
  const style: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    width: `${col.value.width + 1}px`,
    height: `${row.value.height + 1}px`,
    marginLeft: '-1px',
    marginTop: '-1px',
    border: '1px solid var(--cell-border-color)',
    userSelect: 'none',
    overflow: 'hidden',
  }

  if (isActiveCell.value || isEditingCell.value) {
    style.border = '1px solid var(--active-cell-border-color)'
    style['z-index'] = 10
    if (isEditingCell.value) {
      style.outline = '2px solid var(--editing-cell-outline-color)'
    }
    else {
      style.overflow = 'visible'
    }
  }

  if (isInsideSelection.value) {
    style.backgroundColor = 'var(--selected-cell-background-color)'
  }
  else {
    style.backgroundColor = 'var(--cell-background-color)'
  }

  if (cell.value?.style.value.bold) {
    style.fontWeight = 'bold'
  }
  if (cell.value?.style.value.italic) {
    style.fontStyle = 'italic'
  }
  return style
})

function inspectCell(e: MouseEvent) {
  if (!debugMode.value) {
    return
  }

  if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault()
    sidePanelOpen.value = true
    currentTab.value = 'repl'
    run(`(GetCell "${cellId.value.id}") ;; Inspecting Cell`)
  }
}
</script>

<template>
  <div
    :id="cellId.id"
    :style="cellStyle"
    class="px-1 flex box-border items-center text-sm whitespace-nowrap"
    @dblclick="emit('cell-dblclick', cellId)"
    @click="inspectCell"
  >
    {{ cellContent }}
  </div>
</template>
