<script setup lang="ts">
import { computed, toRefs, watch, type CSSProperties } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { CellId } from '~/lib/CellId'
import { defaultFontSize, defaultLineHeight, getLineHeight } from '~/lib/CellStyle'
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
    height: `${row.value.height.value + 1}px`,
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
    style.overflow = 'visible'
  }

  if (isInsideSelection.value) {
    style.backgroundColor = 'var(--selected-cell-background-color)'
  }
  else {
    style.backgroundColor = 'var(--cell-background-color)'
  }

  if (cell.value) {
    const cellStyle = cell.value.style.value
    style.fontSize = `${cellStyle.fontSize}px`
    style.lineHeight = `${getLineHeight(cellStyle.fontSize) - 1}px`
    if (cellStyle.bold) {
      style.fontWeight = 'bold'
    }
    if (cellStyle.italic) {
      style.fontStyle = 'italic'
    }
    if (cellStyle.textDecoration) {
      if (cellStyle.textDecoration === 'underline') {
        style.textDecoration = 'underline'
      }
      else if (cellStyle.textDecoration === 'line-through') {
        style.textDecoration = 'line-through'
      }
    }

    if (cellStyle.justify) {
      if (cellStyle.justify === 'left') {
        style.justifyContent = 'flex-start'
      }
      else if (cellStyle.justify === 'center') {
        style.justifyContent = 'center'
      }
      else if (cellStyle.justify === 'right') {
        style.justifyContent = 'flex-end'
      }
    }
    else {
      style.justifyContent = cell.value.isNumber.value ? 'right' : 'left'
    }

    if (cellStyle.align) {
      if (cellStyle.align === 'top') {
        style.alignItems = 'flex-start'
      }
      else if (cellStyle.align === 'middle') {
        style.alignItems = 'center'
      }
      else if (cellStyle.align === 'bottom') {
        style.alignItems = 'flex-end'
      }
    }
    else {
      style.alignItems = 'flex-end'
    }

    if (cell.value.backgroundColorStyle.value) {
      style.backgroundColor = cell.value.backgroundColorStyle.value
    }
  }
  else {
    style.fontSize = `${defaultFontSize}px`
    style.lineHeight = `${defaultLineHeight - 2}px`
    style.justifyContent = 'left'
    style.alignItems = 'flex-end'
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
    class="px-1 h-full flex box-border text-sm whitespace-nowrap"
    @dblclick="emit('cell-dblclick', cellId)"
    @click="inspectCell"
  >
    {{ cellContent }}
  </div>
</template>
