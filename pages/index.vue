<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RangeLocator } from '~/lib/locators/RangeLocator'
import { colHeaderHeight, minColHeight, minRowWidth, rowHeaderWidth } from '~/lib/constants'
import { Project } from '~/lib/project/Project'
import { whs, hs } from '~/lib/utils'
import { RowLocator } from '~/lib/locators/RowLocator'
import { DocumetIdType as DocumentIdType, type Direction } from '~/lib/locators/utils'
import { CellLocator, isCellLocatorString } from '~/lib/locators/CellLocator'
import { ColLocator } from '~/lib/locators/ColLocator'

const project = new Project()
const grid = project.currentGrid
const selection = computed(() => grid.value.selection)
const { sidePanelHandleKeyDown } = useSidePanel()
const { isMacOS } = useDevice()
const hoveredCell = grid.value.hoveredCell

const gridWrapper = ref<HTMLDivElement>()
const GridViewRef = ref()
const rowHeaderRef = ref()
const colHeaderRef = ref()

onMounted(() => {
  window.addEventListener('contextmenu', onContextMenu, true)
  window.addEventListener('mousedown', onMouseDown)
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
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mouseenter', onMouseEnter)
  window.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('mouseout', onMouseLeave)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('blur', onBlur)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

function resetSelection() {
  selection.value.updateSelection(RangeLocator.fromCellLocator(grid.value.position.value))
}

const dbClickTime: number = 300

const mouseDownStart = shallowRef<CellLocator | RowLocator | ColLocator | null>(null)
const rowResizing = shallowRef<{
  rowLocator: RowLocator
  startY: number
  currentRowHeight: number
  y: Ref<number>
} | null>(null)
let rowResizeDblClicked: {
  rowLocator: RowLocator
  time: number
  completed: boolean
} | null = null
const colResizing = shallowRef<{
  colLocator: ColLocator
  startX: number
  currentColWidth: number
  x: Ref<number>
  top: number
  height: number
} | null>(null)
let colResizeDblClicked: {
  colLocator: ColLocator
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

  const [type, , locatorString] = targetId.split(':')
  if (type === DocumentIdType.Cell) {
    const cellLocator = CellLocator.fromString(grid.value, locatorString)
    if (isRightClick && selection.value.selectedRange.value.containsCell(cellLocator)) {
      return
    }

    selection.value.selecting.value = true
    mouseDownStart.value = cellLocator
    if (grid.value.editor.editingLitsCode.value) {
      selection.value.select(cellLocator)
    }
    else {
      grid.value.editor.save()
      resetSelection()
      grid.value.movePositionTo(cellLocator)
    }
  }

  // Until this is handled in each case below.
  if (isRightClick) {
    return
  }

  if (type === DocumentIdType.Col) {
    selection.value.selecting.value = true
    const colLocator = ColLocator.fromString(grid.value, locatorString)
    mouseDownStart.value = colLocator
    const col = grid.value.getCol(colLocator)
    if (col) {
      resetSelection()
      if (!grid.value.editor.editingLitsCode.value) {
        grid.value.movePositionTo(CellLocator.fromString(grid.value, `${col.label.value}1`))
      }
      selection.value.selectColRange(col, col)
    }
  }
  if (type === DocumentIdType.ResizeCol) {
    const colLocator = ColLocator.fromString(grid.value, locatorString)
    const col = grid.value.getCol(colLocator)
    const x = event.clientX
    const rect = gridWrapper.value!.getBoundingClientRect()
    colResizing.value = {
      colLocator,
      startX: x,
      currentColWidth: col.width.value,
      x: ref(x),
      top: rect.top,
      height: rect.height,
    }
    if (
      colResizeDblClicked
      && colLocator.isSameCol(colResizeDblClicked.colLocator)
      && Date.now() - colResizeDblClicked.time < dbClickTime
    ) {
      colResizeDblClicked.completed = true
    }
    else {
      colResizeDblClicked = { colLocator, time: Date.now(), completed: false }
    }
  }

  if (type === DocumentIdType.Row) {
    selection.value.selecting.value = true
    const rowLocator = RowLocator.fromString(grid.value, locatorString)
    mouseDownStart.value = rowLocator
    const row = grid.value.getRow(rowLocator)
    if (row) {
      resetSelection()
      if (!grid.value.editor.editingLitsCode.value) {
        grid.value.movePositionTo(CellLocator.fromString(grid.value, `A${row.label.value}`))
      }
      selection.value.selectRowRange(row, row)
    }
  }
  if (type === DocumentIdType.ResizeRow) {
    const rowLocator = RowLocator.fromString(grid.value, locatorString)
    const row = grid.value.getRow(rowLocator)
    const y = event.clientY
    rowResizing.value = {
      rowLocator,
      startY: y,
      currentRowHeight: row.height.value,
      y: ref(y),
    }
    if (
      rowResizeDblClicked
      && rowLocator.isSameRow(rowResizeDblClicked.rowLocator)
      && Date.now() - rowResizeDblClicked.time < dbClickTime
    ) {
      rowResizeDblClicked.completed = true
    }
    else {
      rowResizeDblClicked = { rowLocator, time: Date.now(), completed: false }
    }
  }
}
function onMouseMove(event: MouseEvent) {
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
  if (event.button !== 0) {
    return
  }
  mouseDownStart.value = null

  const target = event.target as HTMLElement | undefined
  const id = target?.id

  if (selection.value.selecting.value || (id && isCellLocatorString(id))) {
    project.clipboard.pasteStyleSelection(selection.value.selectedRange.value)
  }
  selection.value.selecting.value = false

  if (rowResizeDblClicked?.completed) {
    const { rowLocator } = rowResizeDblClicked
    const rows = new Set(grid.value.getSelectedRowsWithRowId(rowLocator, selection.value.selectedRange.value).map(row => row.index.value))
    rows.add(rowLocator.row)
    grid.value.autoSetRowHeight(Array.from(rows))
    rowResizeDblClicked = null
    rowResizing.value = null
  }
  else if (rowResizing.value) {
    const { rowLocator, startY, y } = rowResizing.value

    const row = grid.value.getRow(rowLocator)
    const height = row.height.value + y.value - startY
    row.height.value = height

    grid.value.getSelectedRowsWithRowId(rowLocator, selection.value.selectedRange.value)
      .filter(row => row.index.value !== rowLocator.row)
      .forEach((row) => {
        row.height.value = height
      })
    rowResizing.value = null
  }
  else if (colResizeDblClicked?.completed) {
    const { colLocator } = colResizeDblClicked
    const cols = new Set(grid.value.getSelectedColsWithColId(colLocator, selection.value.selectedRange.value).map(col => col.index.value))
    cols.add(colLocator.col)
    grid.value.autoSetColWidth(Array.from(cols))
    colResizeDblClicked = null
    colResizing.value = null
  }

  else if (colResizing.value) {
    const { colLocator, startX, x } = colResizing.value
    const col = grid.value.getCol(colLocator)
    const width = col.width.value + x.value - startX
    col.width.value = width

    grid.value.getSelectedColsWithColId(colLocator, selection.value.selectedRange.value)
      .filter(col => col.index.value !== colLocator.col)
      .forEach((col) => {
        col.width.value = width
      })
    colResizing.value = null
  }
}

function onMouseEnter(event: MouseEvent) {
  if (colResizing.value || rowResizing.value) {
    return
  }
  const target = event.target as HTMLElement | undefined

  const targetId = target?.id
  if (!targetId) {
    return
  }

  const [type, , locatorString] = targetId.split(':')

  const cellLocator = type === DocumentIdType.Cell ? CellLocator.fromString(grid.value, locatorString) : null
  if (cellLocator) {
    hoveredCell.value = cellLocator
  }
  if (mouseDownStart.value) {
    if (mouseDownStart.value instanceof CellLocator && cellLocator) {
      selection.value.select(RangeLocator.fromCellLocators(mouseDownStart.value, cellLocator))
    }
    else if (mouseDownStart.value instanceof ColLocator && type === DocumentIdType.Col) {
      const colLocator = ColLocator.fromString(grid.value, locatorString)
      const fromCol = grid.value.getCol(mouseDownStart.value)
      const toCol = grid.value.getCol(colLocator)
      if (fromCol && toCol) {
        selection.value.selectColRange(fromCol, toCol)
      }
    }
    else if (mouseDownStart.value instanceof RowLocator && type === DocumentIdType.Row) {
      const rowLocator = RowLocator.fromString(grid.value, locatorString)
      const fromRow = grid.value.getRow(mouseDownStart.value)
      const toRow = grid.value.getRow(rowLocator)
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
  const isMeta = isMacOS ? e.metaKey : e.ctrlKey
  if (sidePanelHandleKeyDown(e)) {
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
    project.clipboard.copyRange(selection.value.selectedRange.value)
  }
  else if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
    project.clipboard.cutSelection(selection.value.selectedRange.value)
  }
  else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
    project.clipboard.pasteSelection(selection.value.selectedRange.value)
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
      'selecting': selection.selecting,
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
