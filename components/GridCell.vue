<script setup lang="ts">
import { computed, toRefs, watch, type CSSProperties } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { CellId } from '~/lib/CellId'
import { getLineHeight } from '~/lib/CellStyle'
import type { Col } from '~/lib/Col'
import type { Row } from '~/lib/Row'
import type { Color } from '~/lib/color'
import { CellRange } from '~/lib/CellRange'

const props = defineProps<{
  row: Row
  col: Col
}>()

const emit = defineEmits<{
  (e: 'cell-dblclick', cellId: CellId): void
}>()

const { grid } = useGrid()
const { editorFocused, editorText, editingCellId, isEditingLitsCode } = useEditor()
const { currentTab, sidePanelOpen } = useSidePanel()
const { run } = useREPL()
const { debugMode } = useDebug()
const colorMode = useColorMode()
const { selection } = useSelection()
const { hoveredCellId } = useHover()

const { row, col } = toRefs(props)

const cellId = computed(() => CellId.fromCoords(row.value.index, col.value.index))
const cell = computed(() => grid.value.getCell(cellId.value))
const isActiveCell = computed(() => grid.value.position.value.equals(cellId.value))
const insideSelection = computed(() => selection.value.size() > 1 && selection.value.contains(cellId.value))
const isReferenced = computed(() => {
  const targets = grid.value.getCell(grid.value.position.value).localReferencedTargets.value
  const ranges = targets.map(target => CellRange.isCellRange(target) ? target : CellRange.fromSingleCellId(target))
  return ranges.some(range => range.contains(cellId.value))
})
const hoverSelectingCell = computed(() => isEditingLitsCode.value
  && !isActiveCell.value && hoveredCellId.value && hoveredCellId.value === cellId.value.id)

const isEditingCell = computed(() => editorFocused.value && editingCellId.value.equals(cellId.value))
const cellContent = computed(() => {
  if (isEditingCell.value) {
    return editorText
  }
  return grid.value.getCell(cellId.value).display
})

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

watch(grid.value.position, (position) => {
  const cellElement = document.getElementById(position.id)
  cellElement?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  })
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
      if (isEditingLitsCode.value) {
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

  if (editorFocused.value && isReferenced.value) {
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
  <div class="h-full relative">
    <div
      :id="cellId.id"
      :style="cellStyle"
      class="px-1 h-full relative flex box-border text-sm whitespace-nowrap"
      :class="{
        'cursor-pointer': hoverSelectingCell,
      }"
      @dblclick="emit('cell-dblclick', cellId)"
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
