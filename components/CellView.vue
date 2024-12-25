<script setup lang="ts">
import { computed, toRefs, type CSSProperties } from 'vue'
import type { Col } from '~/lib/Col'
import type { Row } from '~/lib/Row'
import type { Color } from '~/lib/color'
import { getLineHeight } from '~/lib/constants'
import type { Project } from '~/lib/project/Project'
import { CellReference } from '~/lib/reference/CellReference'
import { getDocumentCellId } from '~/lib/reference/utils'

const props = defineProps<{
  project: Project
  row: Row
  col: Col
}>()

const emit = defineEmits<{
  (e: 'cell-dblclick', cellReference: CellReference): void
}>()

const { project, row, col } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const { currentTab, sidePanelOpen } = useSidePanel()
const repl = project.value.repl
const { debugMode } = useDebug()
const colorMode = useColorMode()

const reference = computed(() => CellReference.fromCoords(grid.value, { row: row.value.index.value, col: col.value.index.value }))
const cell = computed(() => reference.value.getCell())
const cellContent = computed(() => reference.value.getCell().display)

const cellId = computed(() => getDocumentCellId(reference.value))

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

  style.fontSize = `${cell.value.fontSize.value}px`
  style.lineHeight = `${getLineHeight(cell.value.fontSize.value) - 1}px`
  if (cell.value.bold.value) {
    style.fontWeight = 'bold'
  }
  if (cell.value.italic.value) {
    style.fontStyle = 'italic'
  }
  if (cell.value.textDecoration.value) {
    if (cell.value.textDecoration.value === 'underline') {
      style.textDecoration = 'underline'
    }
    else if (cell.value.textDecoration.value === 'line-through') {
      style.textDecoration = 'line-through'
    }
  }

  if (cell.value.justify.value) {
    if (cell.value.justify.value === 'left') {
      style.textAlign = 'left'
      style.justifyContent = 'flex-start'
    }
    else if (cell.value.justify.value === 'center') {
      style.textAlign = 'center'
      style.justifyContent = 'center'
    }
    else if (cell.value.justify.value === 'right') {
      style.textAlign = 'right'
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

  if (cell.value.align.value) {
    if (cell.value.align.value === 'top') {
      style.alignItems = 'flex-start'
    }
    else if (cell.value.align.value === 'middle') {
      style.alignItems = 'center'
    }
    else if (cell.value.align.value === 'bottom') {
      style.alignItems = 'flex-end'
    }
  }
  else {
    style.alignItems = 'flex-end'
  }

  if (cellBackgroundColor.value) {
    style.backgroundColor = cellBackgroundColor.value.getStyleString()
  }
  if (cellTextColor.value) {
    style.color = cellTextColor.value.getStyleString()
  }
  else if (cell.value.hasError.value) {
    style.color = 'var(--error-color)'
  }
  // }

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
    repl.run(`(GetCell "${reference.value.toStringWithGrid()}") ;; Inspecting Cell`)
  }
}
</script>

<template>
  <div class="h-full relative">
    <div
      :id="cellId"
      :style="cellStyle"
      class="px-1 h-full relative flex box-border text-sm whitespace-pre"
      @dblclick="emit('cell-dblclick', reference)"
      @click="inspectCell"
    >
      {{ cellContent }}
    </div>
    <!-- <div
      v-if="hoverSelectingCell"
      class="z-[100] pointer-events-none block absolute top-[1px] right-[1px] bottom-0 left-0 bg-red outline-dotted dark:outline-slate-600 outline-gray-400"
    /> -->
  </div>
</template>
