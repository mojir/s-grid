<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RangeReference } from '~/lib/reference/RangeReference'
import { colHeaderHeight, defaultNbrOfCols, defaultNbrOfRows, minColHeight, minRowWidth, rowHeaderWidth } from '~/lib/constants'
import { Project } from '~/lib/project/Project'
import { DocumentIdType, type Direction } from '~/lib/reference/utils'
import { CellReference, isCellReferenceString } from '~/lib/reference/CellReference'
import type { Diagram } from '~/lib/Diagram'

type RowIdentifier = {
  rowIndex: number
}
function isRowIdentifier(value: unknown): value is RowIdentifier {
  return !!value && (value as RowIdentifier).rowIndex !== undefined
}
type ColIdentifier = {
  colIndex: number
}
function isColIdentifier(value: unknown): value is ColIdentifier {
  return !!value && (value as ColIdentifier).colIndex !== undefined
}

const project = new Project({
  grids: [
    {
      name: 'Grid1',
      nbrOfRows: defaultNbrOfRows,
      nbrOfCols: defaultNbrOfCols,
      cells: {},
      rowHeights: {},
      colWidths: {},
    },
  ],
  currentGridIndex: 0,
  aliases: {},
})
project.pubSub.subscribe({
  listener: 'UI',
  filter: { Alert: true },
  callback: (event) => {
    if (event.type === 'Alert') {
      alert(event.data.title)
    }
  },
})

const grid = project.currentGrid
const selection = computed(() => grid.value.selection)

const { sidePanelActive, sidePanelHandleKeyDown } = useSidePanel()
const { isMacOS } = useDevice()
const hoveredCell = grid.value.hoveredCell

const gridWrapper = ref<HTMLDivElement>()
const GridViewRef = ref()
const rowHeaderRef = ref()
const colHeaderRef = ref()

onMounted(() => {
  window.addEventListener('contextmenu', onContextMenu, true)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousedown', captureMouseDown, true)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mouseenter', onMouseEnter)
  window.addEventListener('mouseover', onMouseEnter)
  window.addEventListener('mouseleave', onMouseLeave)
  window.addEventListener('mouseout', onMouseLeave)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('blur', onBlur)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})
onUnmounted(() => {
  window.removeEventListener('contextmenu', onContextMenu, true)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mousedown', captureMouseDown, true)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mouseenter', onMouseEnter)
  window.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('mouseout', onMouseLeave)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('blur', onBlur)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

function captureMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (isTargetInSidePanel(target)) {
    sidePanelActive.value = true
  }
  else {
    sidePanelActive.value = false
    const diagram = getDiagramFromTarget(target)
    if (diagram) {
      project.diagrams.activeDiagram.value = diagram
    }
    else {
      project.diagrams.activeDiagram.value = null
    }
  }
}

function isTargetInSidePanel(target: HTMLElement): boolean {
  const sidePanel = document.getElementById('side-panel')
  return !!sidePanel && (sidePanel === target || sidePanel.contains(target))
}

function getDiagramFromTarget(target: HTMLElement | null): Diagram | null {
  if (!target) {
    return null
  }
  if (target.id && target.id.startsWith('diagram|')) {
    const diagramId = target.id.split('|')[1]
    return typeof diagramId === 'string'
      ? project.diagrams.getDiagram(diagramId) ?? null
      : null
  }
  return getDiagramFromTarget(target.parentElement)
}

function resetSelection() {
  const location = RangeReference.fromCellReference(grid.value.position.value)
  selection.value.updateSelection(location.start, location.end)
}

const dbClickTime: number = 300

const mouseDownStart = shallowRef<CellReference | RowIdentifier | ColIdentifier | null>(null)
const rowResizing = shallowRef<{
  rowIndex: number
  startY: number
  currentRowHeight: number
  y: Ref<number>
} | null>(null)
let rowResizeDblClicked: {
  rowIndex: number
  time: number
  completed: boolean
} | null = null
const colResizing = shallowRef<{
  colIndex: number
  startX: number
  currentColWidth: number
  x: Ref<number>
  top: number
  height: number
} | null>(null)
let colResizeDblClicked: {
  colIndex: number
  time: number
  completed: boolean
} | null = null

function onBlur() {
  hoveredCell.value = null
}

// Handle cases when user switches tabs
const handleVisibilityChange = () => {
  if (document.hidden) {
    hoveredCell.value = null
    mouseDownStart.value = null
    colResizing.value = null
    rowResizing.value = null
  }
}

function onContextMenu(event: MouseEvent) {
  if (grid.value.editor.editing.value) {
    event.preventDefault()
  }
}

function onMouseDown(event: MouseEvent) {
  if (sidePanelActive.value) {
    return
  }

  project.diagrams.handleMouseDown(event)
  project.autoFiller.handleMouseDown(event)

  const isRightClick = event.button === 2 || (event.button === 0 && event.ctrlKey)

  if (grid.value.editor.editing.value && isRightClick) {
    event.preventDefault()
    return
  }
  // Ignore middle mouse button
  if (event.button !== 0 && !isRightClick) {
    return
  }

  const target = event.target as HTMLElement | undefined
  const targetId = target?.id
  if (!targetId) {
    return
  }

  const [type, , cellReferenceString] = targetId.split('|')
  if (type === DocumentIdType.Cell) {
    const reference = CellReference.fromString(grid.value, cellReferenceString!)
    if (isRightClick && selection.value.selectedRange.value.containsCell(reference)) {
      return
    }
    grid.value.state.value = 'selecting'

    if (grid.value.editor.editingLitsCode.value) {
      mouseDownStart.value = reference
      selection.value.updateSelection(reference)
    }
    else if (event.shiftKey) {
      mouseDownStart.value = grid.value.selection.selectedRange.value.start
      selection.value.expandSelectionTo(reference)
    }
    else {
      mouseDownStart.value = reference
      grid.value.editor.save()
      resetSelection()
      grid.value.movePositionTo(reference)
    }
  }

  // Until this is handled in each case below.
  if (isRightClick) {
    return
  }

  if (type === DocumentIdType.Col) {
    grid.value.state.value = 'selecting'
    const colIndex = Number(cellReferenceString)
    mouseDownStart.value = {
      colIndex,
    }
    const col = grid.value.getCol(colIndex)
    if (col) {
      resetSelection()
      if (!grid.value.editor.editingLitsCode.value) {
        grid.value.movePositionTo(CellReference.fromString(grid.value, `${col.label.value}1`))
      }
      selection.value.selectColRange(col, col)
    }
  }
  if (type === DocumentIdType.ResizeCol) {
    const colIndex = Number(cellReferenceString)
    const col = grid.value.getCol(colIndex)
    const x = event.clientX
    const rect = gridWrapper.value!.getBoundingClientRect()
    colResizing.value = {
      colIndex,
      startX: x,
      currentColWidth: col.width.value,
      x: ref(x),
      top: rect.top,
      height: rect.height,
    }
    if (
      colResizeDblClicked
      && colIndex === colResizeDblClicked.colIndex
      && Date.now() - colResizeDblClicked.time < dbClickTime
    ) {
      colResizeDblClicked.completed = true
    }
    else {
      colResizeDblClicked = { colIndex, time: Date.now(), completed: false }
    }
  }

  if (type === DocumentIdType.Row) {
    grid.value.state.value = 'selecting'
    const rowIndex = Number(cellReferenceString)
    mouseDownStart.value = {
      rowIndex,
    }
    const row = grid.value.getRow(rowIndex)
    if (row) {
      resetSelection()
      if (!grid.value.editor.editingLitsCode.value) {
        grid.value.movePositionTo(CellReference.fromString(grid.value, `A${row.label.value}`))
      }
      selection.value.selectRowRange(row, row)
    }
  }
  if (type === DocumentIdType.ResizeRow) {
    const rowIndex = Number(cellReferenceString)
    const row = grid.value.getRow(rowIndex)
    const y = event.clientY
    rowResizing.value = {
      rowIndex,
      startY: y,
      currentRowHeight: row.height.value,
      y: ref(y),
    }
    if (
      rowResizeDblClicked
      && rowIndex === rowResizeDblClicked.rowIndex
      && Date.now() - rowResizeDblClicked.time < dbClickTime
    ) {
      rowResizeDblClicked.completed = true
    }
    else {
      rowResizeDblClicked = { rowIndex, time: Date.now(), completed: false }
    }
  }
}
function onMouseMove(event: MouseEvent) {
  if (sidePanelActive.value) {
    return
  }

  project.diagrams.handleMouseMove(event)
  project.autoFiller.handleMouseMove(event)

  if (rowResizing.value) {
    const { currentRowHeight, startY } = rowResizing.value
    const y = event.clientY
    const newHeight = currentRowHeight + y - startY
    rowResizing.value.y.value = newHeight > minColHeight
      ? y
      : rowResizing.value.startY - currentRowHeight + minColHeight
  }
  if (colResizing.value) {
    const { currentColWidth, startX } = colResizing.value
    const x = event.clientX
    const newWidth = currentColWidth + x - startX
    colResizing.value.x.value = newWidth > minRowWidth
      ? x
      : colResizing.value.startX - currentColWidth + minRowWidth
  }
}
function onMouseUp(event: MouseEvent) {
  if (sidePanelActive.value) {
    return
  }

  project.diagrams.handleMouseUp()
  project.autoFiller.handleMouseUp()

  if (event.button !== 0) {
    return
  }
  mouseDownStart.value = null

  const target = event.target as HTMLElement | undefined
  const id = target?.id

  if (grid.value.state.value === 'selecting' || (id && isCellReferenceString(id))) {
    project.clipboard.pasteStyles(selection.value.selectedRange.value)
  }
  grid.value.state.value = 'idle'

  if (rowResizeDblClicked?.completed) {
    const { rowIndex } = rowResizeDblClicked
    const rows = new Set(grid.value.getSelectedRowsWithRowIndex(rowIndex))
    rows.add(rowIndex)
    grid.value.autoSetRowHeight({ rowIndices: Array.from(rows) })
    rowResizeDblClicked = null
    rowResizing.value = null
  }
  else if (rowResizing.value) {
    const { rowIndex, startY, y } = rowResizing.value

    const row = grid.value.getRow(rowIndex)
    const height = row.height.value + y.value - startY
    row.setHeight(height)

    grid.value.getSelectedRowsWithRowIndex(rowIndex)
      .filter(index => index !== rowIndex)
      .forEach((index) => {
        grid.value.getRow(index).setHeight(height)
      })
    rowResizing.value = null
  }
  else if (colResizeDblClicked?.completed) {
    const { colIndex } = colResizeDblClicked
    const cols = new Set(grid.value.getSelectedColsWithColIndex(colIndex))
    cols.add(colIndex)
    grid.value.autoSetColWidth(Array.from(cols))
    colResizeDblClicked = null
    colResizing.value = null
  }

  else if (colResizing.value) {
    const { colIndex, startX, x } = colResizing.value
    const col = grid.value.getCol(colIndex)
    const width = col.width.value + x.value - startX
    col.setWidth(width)

    grid.value.getSelectedColsWithColIndex(colIndex)
      .filter(col => col !== colIndex)
      .forEach((col) => {
        grid.value.getCol(col).setWidth(width)
      })
    colResizing.value = null
  }
  if (grid.value.editor.editing.value) {
    resetSelection()
  }
}

function onMouseEnter(event: MouseEvent) {
  if (sidePanelActive.value) {
    return
  }

  if (colResizing.value || rowResizing.value) {
    return
  }
  const target = event.target as HTMLElement | undefined

  const targetId = target?.id
  if (!targetId) {
    return
  }

  const [type, , cellReferenceString] = targetId.split('|')

  const reference = type === DocumentIdType.Cell ? CellReference.fromString(grid.value, cellReferenceString!) : null
  if (reference) {
    hoveredCell.value = reference
  }
  if (mouseDownStart.value) {
    if (mouseDownStart.value instanceof CellReference && reference) {
      selection.value.updateSelection(mouseDownStart.value, reference)
    }
    else if (isColIdentifier(mouseDownStart.value) && type === DocumentIdType.Col) {
      const colIndex = Number(cellReferenceString)
      const fromCol = grid.value.cols.value[mouseDownStart.value.colIndex]
      const toCol = grid.value.getCol(colIndex)
      if (fromCol && toCol) {
        selection.value.selectColRange(fromCol, toCol)
      }
    }
    else if (isRowIdentifier(mouseDownStart.value) && type === DocumentIdType.Row) {
      const rowIndex = Number(cellReferenceString)
      const fromRow = grid.value.rows.value[mouseDownStart.value.rowIndex]
      const toRow = grid.value.getRow(rowIndex)
      if (fromRow && toRow) {
        selection.value.selectRowRange(fromRow, toRow)
      }
    }
  }
}

function onMouseLeave() {
  hoveredCell.value = null
}

function onCellDblclick() {
  grid.value.editor.edit(null)
}

function shouldSave(e: KeyboardEvent) {
  return e.key === 'Enter'
    || e.key === 'Tab'
    || e.key === 'ArrowDown'
    || e.key === 'ArrowUp'
    || e.key === 'ArrowRight'
    || e.key === 'ArrowLeft'
    || e.key === 'PageDown'
    || e.key === 'PageUp'
    || e.key === 'Home'
    || e.key === 'End'
}

function shouldCancel(e: KeyboardEvent) {
  return e.key === 'Escape'
}

function onKeyDown(e: KeyboardEvent) {
  if (project.keyboardClaimed.value) {
    return
  }
  const isMeta = isMacOS ? e.metaKey : e.ctrlKey
  if (sidePanelHandleKeyDown(e)) {
    return
  }
  if (sidePanelActive.value) {
    return
  }

  let saved = false
  if (grid.value.editor.editing.value) {
    if (shouldSave(e)) {
      saved = true
      grid.value.editor.save()
    }
    else if (shouldCancel(e)) {
      grid.value.editor.cancel()
    }
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    grid.value.editor.edit(e, false)
  }

  if (e.key === 'z' && isMeta && !e.shiftKey) {
    e.preventDefault()
    project.history.undo()
  }
  else if (e.key === 'z' && isMeta && e.shiftKey) {
    e.preventDefault()
    project.history.redo()
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    if (saved || selection.value.selectedRange.value.size() > 1) {
      if (e.shiftKey) {
        grid.value.movePosition('up', true)
      }
      else {
        grid.value.movePosition('down', true)
      }
    }
    else {
      grid.value.editor.edit(null)
    }
  }
  else if (e.key === 'Tab') {
    e.preventDefault()
    if (e.shiftKey) {
      grid.value.movePosition('left', true)
    }
    else {
      grid.value.movePosition('right', true)
    }
  }
  else if (e.key === 'Backspace' || e.key === 'Delete') {
    grid.value.clearInput(selection.value.selectedRange.value)
  }
  else if (e.key === 'F2') {
    grid.value.editor.edit(null)
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const dir: Direction = isMeta ? 'pageDown' : 'down'
    if (e.shiftKey) {
      selection.value.expandSelection(dir)
    }
    else {
      grid.value.movePosition(dir)
      resetSelection()
    }
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    const dir: Direction = isMeta ? 'pageUp' : 'up'
    if (e.shiftKey) {
      selection.value.expandSelection(dir)
    }
    else {
      grid.value.movePosition(dir)
      resetSelection()
    }
  }
  else if (e.key === 'ArrowRight') {
    e.preventDefault()
    const dir: Direction = isMeta ? 'pageRight' : 'right'
    if (e.shiftKey) {
      selection.value.expandSelection(dir)
    }
    else {
      grid.value.movePosition(dir)
      resetSelection()
    }
  }
  else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    const dir: Direction = isMeta ? 'pageLeft' : 'left'
    if (e.shiftKey) {
      selection.value.expandSelection(dir)
    }
    else {
      grid.value.movePosition(dir)
      resetSelection()
    }
  }
  else if (e.key === 'Home') {
    e.preventDefault()
    if (e.shiftKey) {
      selection.value.expandSelection('top')
    }
    else {
      grid.value.movePosition('top')
      resetSelection()
    }
  }
  else if (e.key === 'End') {
    e.preventDefault()
    if (e.shiftKey) {
      selection.value.expandSelection('bottom')
    }
    else {
      grid.value.movePosition('bottom')
      resetSelection()
    }
  }
  else if (e.key === 'PageDown') {
    e.preventDefault()
    if (e.shiftKey) {
      selection.value.expandSelection('pageDown')
    }
    else {
      grid.value.movePosition('pageDown')
      resetSelection()
    }
  }
  else if (e.key === 'PageUp') {
    e.preventDefault()
    if (e.shiftKey) {
      selection.value.expandSelection('pageUp')
    }
    else {
      grid.value.movePosition('pageUp')
      resetSelection()
    }
  }
  else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
    project.clipboard.copy(selection.value.selectedRange.value)
  }
  else if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
    project.clipboard.cut(selection.value.selectedRange.value)
  }
  else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
    project.clipboard.paste(selection.value.selectedRange.value)
  }
}

const { syncScroll, setScrollPosition } = useSyncScroll(GridViewRef, rowHeaderRef, colHeaderRef, (value) => {
  grid.value.setScrollPosition(value)
})

watch(grid, () => {
  setScrollPosition(grid.value.getScrollPosition())
}, { immediate: true })
</script>

<template>
  <div
    class="flex flex-grow h-screen dark:bg-slate-900 bg-gray-100 dark:text-slate-300 text-gray-700"
    :class="{
      'cursor-row-resize': rowResizing,
      'cursor-col-resize': colResizing,
      'selecting': grid.state.value === 'selecting',
    }"
  >
    <div
      class="flex flex-col overflow-hidden w-screen"
    >
      <div class="m-4">
        <Toolbar :project="project" />
      </div>
      <FormulaBar
        ref="formulaBarRef"
        :project="project"
      />
      <div
        ref="gridWrapper"
        class="flex flex-grow flex-col overflow-hidden"
      >
        <div
          class="flex"
          :style="hs(colHeaderHeight)"
        >
          <div
            class="flex dark:bg-slate-800 bg-gray-200 box-border border-b border-r dark:border-slate-700 border-gray-300"
            :style="whs(rowHeaderWidth + 1, colHeaderHeight + 1)"
            @click="selection.selectAll"
          />
          <ColHeader
            ref="colHeaderRef"
            :project="project"
            @scroll="syncScroll"
          />
        </div>
        <div class="flex overflow-hidden">
          <RowHeader
            ref="rowHeaderRef"
            :project="project"
            @scroll="syncScroll"
          />
          <GridView
            ref="GridViewRef"
            :project="project"
            @scroll="syncScroll"
            @cell-dblclick="onCellDblclick"
          />
          <div
            v-if="rowResizing"
            class="absolute z-[1000] bg-gray-500/20 dark:bg-slate-500/50 left-0 right-0 h-[4px]"
            :style="{ top: `${rowResizing.y.value - 2}px` }"
          />
          <div
            v-if="colResizing"
            class="absolute z-[1000] bg-gray-500/20 dark:bg-slate-500/50 w-[4px]"
            :style="{
              left: `${colResizing.x.value - 2}px`,
              top: `${colResizing.top}px`,
              height: `${colResizing.height}px`,
            }"
          />
        </div>
      </div>
      <FooterBar :project="project" />
    </div>
    <SidePanel :project="project" />
  </div>
</template>

<style scoped>
.cursor-row-resize {
  cursor: row-resize !important;
}
.cursor-col-resize {
  cursor: col-resize !important;
}

.cursor-col-resize, .cursor-row-resize, .selecting {
  user-select: none;
}
</style>
