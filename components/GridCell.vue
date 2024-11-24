<script setup lang="ts">
import { computed, toRefs, type CSSProperties } from 'vue'
import type { Col } from '~/lib/Col'
import type { Row } from '~/lib/Row'
import type { Color } from '~/lib/color'
import { RangeLocator } from '~/lib/locator/RangeLocator'
import { getLineHeight } from '~/lib/constants'
import type { GridProject } from '~/lib/GridProject'
import { CellLocator } from '~/lib/locator/CellLocator'
import { getDocumentCellId } from '~/lib/locator/utils'

const props = defineProps<{
  gridProject: GridProject
  row: Row
  col: Col
}>()

const emit = defineEmits<{
  (e: 'cell-dblclick', cellLocator: CellLocator): void
}>()

const { gridProject, row, col } = toRefs(props)
const grid = gridProject.value.currentGrid
const { currentTab, sidePanelOpen } = useSidePanel()
const repl = gridProject.value.repl
const { debugMode } = useDebug()
const colorMode = useColorMode()
const hoveredCell = grid.value.hoveredCell

const cellLocator = computed(() => CellLocator.fromCoords({ row: row.value.index.value, col: col.value.index.value }))
const cell = computed(() => grid.value.getCellFromLocator(cellLocator.value))
const isActiveCell = computed(() => grid.value.position.value.isSameCell(cellLocator.value))
const insideSelection = computed(() => grid.value.selection.selectedRange.value.size() > 1 && grid.value.selection.selectedRange.value.containsCell(cellLocator.value))
const isReferenced = computed(() => {
  const targets = grid.value.getCellFromLocator(grid.value.position.value).localReferenceLocators.value
  const ranges = targets.map(target => target instanceof RangeLocator ? target : RangeLocator.fromCellLocator(target))
  return ranges.some(range => range.containsCell(cellLocator.value))
})
const hoverSelectingCell = computed(() => grid.value.editor.isEditingLitsCode.value
  && !isActiveCell.value && hoveredCell.value && hoveredCell.value.isSameCell(cellLocator.value))

const isEditingCell = computed(() => grid.value.editor.editorFocused.value && grid.value.editor.editingCellId.value.isSameCell(cellLocator.value))
const cellContent = computed(() => {
  if (isEditingCell.value) {
    return grid.value.editor.editorText
  }
  return grid.value.getCellFromLocator(cellLocator.value).display
})

const cellId = computed(() => getDocumentCellId(cellLocator.value, grid.value.name.value))

const cellBackgroundColor = computed<Color | null>(() => {
  const bg = cell.value.backgroundColor.value
  if (!bg) {
    return null
  }

  if (colorMode.value === 'dark') {
    return bg.toggleLightness()
  }
  return bg
})

const cellTextColor = computed<Color | null>(() => {
  const c = cell.value.textColor.value
  if (!c) {
    return null
  }

  if (colorMode.value === 'dark') {
    return c.toggleLightness()
  }
  return c
})

const cellStyle = computed(() => {
  const style: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    width: `${col.value.width.value + 1}px`,
    height: `${row.value.height.value + 1}px`,
    marginLeft: '-1px',
    marginTop: '-1px',
    border: '1px solid var(--cell-border-color)',
    userSelect: 'none',
    overflow: 'hidden',
  }

  if (isActiveCell.value || isEditingCell.value) {
    style.border = '1px solid var(--current-cell-border-color)'
    style['z-index'] = 10
    if (isEditingCell.value) {
      if (grid.value.editor.isEditingLitsCode.value) {
        style.outline = '3px dashed var(--editing-lits-cell-outline-color)'
        style.outlineOffset = '1px'
      }
      else {
        style.outline = '2px dashed var(--editing-cell-outline-color)'
        style.outlineOffset = '1px'
      }
    }
    style.overflow = 'visible'
  }

  if (insideSelection.value) {
    style.backgroundColor = 'var(--selected-cell-background-color)'
  }
  else {
    style.backgroundColor = 'var(--cell-background-color)'
  }

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
    style.justifyContent = cell.value.isNumber.value
      ? 'right'
      : cell.value.hasError.value
        ? 'center'
        : 'left'
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

  if (grid.value.editor.editorFocused.value && isReferenced.value) {
    style.backgroundColor = 'var(--referenced-cell-background-color)'
  }
  else {
    if (cellBackgroundColor.value) {
      style.backgroundColor = insideSelection.value
        ? cellBackgroundColor.value.withAlpha(0.8).getStyleString()
        : isReferenced.value
          ? cellBackgroundColor.value.withAlpha(0.9).getStyleString()
          : cellBackgroundColor.value.getStyleString()
    }
    if (cellTextColor.value) {
      style.color = cellTextColor.value.getStyleString()
    }
    else if (cell.value.hasError.value) {
      style.color = 'var(--error-color)'
    }
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
    repl.run(`(GetCell "${cellLocator.value.toString()}") ;; Inspecting Cell`)
  }
}
</script>

<template>
  <div class="h-full relative">
    <div
      :id="cellId"
      :style="cellStyle"
      class="px-1 h-full relative flex box-border text-sm whitespace-nowrap"
      :class="{
        'cursor-pointer': hoverSelectingCell,
      }"
      @dblclick="emit('cell-dblclick', cellLocator)"
      @click="inspectCell"
    >
      {{ cellContent }}
    </div>
    <div
      v-if="hoverSelectingCell"
      class="z-[100] pointer-events-none block absolute top-[1px] right-[1px] bottom-0 left-0 bg-red outline-dotted dark:outline-slate-600 outline-gray-400"
    />
  </div>
</template>
