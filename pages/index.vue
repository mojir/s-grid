<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { CellId } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import { Col, type ColIdString } from '~/lib/Col'
import { Row, type RowIdString } from '~/lib/Row'
import { whs, hs } from '~/lib/utils'

const grid = useGrid()
const selection = useSelection()
const { colHeaderHeight, rowHeaderWidth } = useRowsAndCols()
const { sidePanelHandleKeyDown } = useSidePanel()
const { isEditingLitsCode: editingLitsCode, editorFocused } = useEditor()
const rowsAndCols = useRowsAndCols()
const { hoveredCellId } = useHover()
const { copySelection, cutSelection, pasteSelection } = useGridClipboard()

const gridWrapper = ref<HTMLDivElement>()
const dataGridRef = ref()
const rowHeaderRef = ref()
const colHeaderRef = ref()
const formulaBarRef = ref()

onMounted(() => {
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
  selection.updateSelection(CellRange.fromSingleCellId(grid.value.position.value))
}

const dbClickTime: number = 300

const mouseDownStart = ref('')
const rowResizing = shallowRef<{
  rowId: RowIdString
  startY: number
  currentRowHeight: number
  y: Ref<number>
} | null>(null)
let rowResizeDblClicked: {
  rowId: RowIdString
  time: number
  completed: boolean
} | null = null
const colResizing = shallowRef<{
  colId: ColIdString
  startX: number
  currentColWidth: number
  x: Ref<number>
  top: number
  height: number
} | null>(null)
let colResizeDblClicked: {
  colId: ColIdString
  time: number
  completed: boolean
} | null = null

function onBlur() {
  hoveredCellId.value = null
}

// Handle cases when user switches tabs
const handleVisibilityChange = () => {
  if (document.hidden) {
    hoveredCellId.value = null
    mouseDownStart.value = ''
    colResizing.value = null
    rowResizing.value = null
  }
}

function onMouseDown(event: MouseEvent) {
  if (event.button !== 0) {
    return
  }
  const target = event.target as HTMLElement | undefined
  const id = target?.id
  if (!id) {
    return
  }
  if (CellId.isCellIdString(id)) {
    selection.selecting.value = true
    mouseDownStart.value = id
    if (editingLitsCode.value) {
      selection.select(id)
    }
    else {
      resetSelection()
      grid.value.movePositionTo(id)
    }
  }
  if (Col.isColIdString(id)) {
    selection.selecting.value = true
    mouseDownStart.value = id
    const col = rowsAndCols.getCol(id)
    if (col) {
      resetSelection()
      if (!editingLitsCode.value) {
        grid.value.movePositionTo(`${col.id.value}1`)
      }
      selection.selectColRange(col, col)
    }
  }
  if (Col.isResizeColId(id)) {
    const colId = id.split(':')[1] as ColIdString
    const col = rowsAndCols.getCol(colId)
    const x = event.clientX
    const rect = gridWrapper.value!.getBoundingClientRect()
    colResizing.value = {
      colId,
      startX: x,
      currentColWidth: col.width.value,
      x: ref(x),
      top: rect.top,
      height: rect.height,
    }
    if (colResizeDblClicked?.colId === colId && Date.now() - colResizeDblClicked.time < dbClickTime) {
      colResizeDblClicked.completed = true
    }
    else {
      colResizeDblClicked = { colId, time: Date.now(), completed: false }
    }
  }

  if (Row.isRowIdString(id)) {
    selection.selecting.value = true
    mouseDownStart.value = id
    const row = rowsAndCols.getRow(id)
    if (row) {
      resetSelection()
      if (!editingLitsCode.value) {
        grid.value.movePositionTo(`A${row.id.value}`)
      }
      selection.selectRowRange(row, row)
    }
  }
  if (Row.isResizeRowId(id)) {
    const rowId = id.split(':')[1] as RowIdString
    const row = rowsAndCols.getRow(rowId)
    const y = event.clientY
    rowResizing.value = {
      rowId,
      startY: y,
      currentRowHeight: row.height.value,
      y: ref(y),
    }
    if (rowResizeDblClicked?.rowId === rowId && Date.now() - rowResizeDblClicked.time < dbClickTime) {
      rowResizeDblClicked.completed = true
    }
    else {
      rowResizeDblClicked = { rowId, time: Date.now(), completed: false }
    }
  }
}
function onMouseMove(event: MouseEvent) {
  if (rowResizing.value) {
    const { currentRowHeight, startY } = rowResizing.value
    const y = event.clientY
    const newHeight = currentRowHeight + y - startY
    rowResizing.value.y.value = newHeight > rowsAndCols.minColHeight
      ? y
      : rowResizing.value.startY - currentRowHeight + rowsAndCols.minColHeight
  }
  if (colResizing.value) {
    const { currentColWidth, startX } = colResizing.value
    const x = event.clientX
    const newWidth = currentColWidth + x - startX
    colResizing.value.x.value = newWidth > rowsAndCols.minRowWidth
      ? x
      : colResizing.value.startX - currentColWidth + rowsAndCols.minRowWidth
  }
}
function onMouseUp(event: MouseEvent) {
  if (event.button !== 0) {
    return
  }
  mouseDownStart.value = ''
  selection.selecting.value = false

  if (rowResizeDblClicked?.completed) {
    const { rowId } = rowResizeDblClicked
    const rows = new Set(rowsAndCols.getSelectedRowsWithRowId(rowId, selection.selection.value).map(row => row.id.value))
    rows.add(rowId)
    grid.value.autoSetRowHeight(Array.from(rows))
    rowResizeDblClicked = null
    rowResizing.value = null
  }
  else if (rowResizing.value) {
    const { rowId, startY, y } = rowResizing.value

    const row = rowsAndCols.getRow(rowId)
    const height = row.height.value + y.value - startY
    row.height.value = height

    rowsAndCols.getSelectedRowsWithRowId(rowId, selection.selection.value)
      .filter(row => row.id.value !== rowId)
      .forEach((row) => {
        row.height.value = height
      })
    rowResizing.value = null
  }
  else if (colResizeDblClicked?.completed) {
    const { colId } = colResizeDblClicked
    const cols = new Set(rowsAndCols.getSelectedColsWithColId(colId, selection.selection.value).map(col => col.id.value))
    cols.add(colId)
    grid.value.autoSetColWidth(Array.from(cols))
    colResizeDblClicked = null
    colResizing.value = null
  }

  else if (colResizing.value) {
    const { colId, startX, x } = colResizing.value
    const col = rowsAndCols.getCol(colId)
    const width = col.width.value + x.value - startX
    col.width.value = width

    rowsAndCols.getSelectedColsWithColId(colId, selection.selection.value)
      .filter(col => col.id.value !== colId)
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
  if (!target) {
    return
  }
  const cellId = CellId.isCellIdString(target.id) ? target.id : null
  if (cellId) {
    hoveredCellId.value = cellId
  }
  if (mouseDownStart.value) {
    if (CellId.isCellIdString(mouseDownStart.value) && cellId) {
      selection.select(`${mouseDownStart.value}-${cellId}`)
    }
    else if (Col.isColIdString(mouseDownStart.value) && Col.isColIdString(target.id)) {
      const fromCol = rowsAndCols.getCol(mouseDownStart.value)
      const toCol = rowsAndCols.getCol(target.id)
      if (fromCol && toCol) {
        selection.selectColRange(fromCol, toCol)
      }
    }
    else if (Row.isRowIdString(mouseDownStart.value) && Row.isRowIdString(target.id)) {
      const fromRow = rowsAndCols.getRow(mouseDownStart.value)
      const toRow = rowsAndCols.getRow(target.id)
      if (fromRow && toRow) {
        selection.selectRowRange(fromRow, toRow)
      }
    }
  }
}

function onMouseLeave() {
  hoveredCellId.value = null
}

function onCellDblclick() {
  formulaBarRef.value.focus()
}

function onKeyDown(e: KeyboardEvent) {
  if (sidePanelHandleKeyDown(e)) {
    return
  }

  if (editorFocused.value) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (editorFocused.value) {
        formulaBarRef.value.save()
      }
      if (e.shiftKey) {
        grid.value.movePosition('up', true)
      }
      else {
        grid.value.movePosition('down', true)
      }
    }
    else if (e.key === 'Escape') {
      formulaBarRef.value.cancel()
    }
    else if (e.key === 'Tab') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        grid.value.movePosition('left', true)
      }
      else {
        grid.value.movePosition('right', true)
      }
    }
  }
  else {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      formulaBarRef.value.update('')
      formulaBarRef.value.focus()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      formulaBarRef.value.focus()
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
      grid.value.clear(selection.selection.value)
      formulaBarRef.value.update('')
    }
    else if (e.key === 'F2') {
      formulaBarRef.value.focus()
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        selection.expandSelection('down')
      }
      else {
        grid.value.movePosition('down')
        resetSelection()
      }
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        selection.expandSelection('up')
      }
      else {
        grid.value.movePosition('up')
        resetSelection()
      }
    }
    else if (e.key === 'ArrowRight') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        selection.expandSelection('right')
      }
      else {
        grid.value.movePosition('right')
        resetSelection()
      }
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        selection.expandSelection('left')
      }
      else {
        grid.value.movePosition('left')
        resetSelection()
      }
    }
    // else if (e.key === 'Home') {
    //   e.preventDefault()
    //   grid.value.movePosition('home')
    //   resetSelection()
    // }
    // else if (e.key === 'End') {
    //   e.preventDefault()
    //   grid.value.movePosition('end')
    //   resetSelection()
    // }
    // else if (e.key === 'PageDown') {
    //   e.preventDefault()
    //   grid.value.movePosition('pagedown')
    //   resetSelection()
    // }
    // else if (e.key === 'PageUp') {
    //   e.preventDefault()
    //   grid.value.movePosition('pageup')
    //   resetSelection()
    // }
    else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      copySelection()
    }
    else if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
      cutSelection()
    }
    else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      pasteSelection()
    }
  }
}

const syncScroll = useSyncScroll(dataGridRef, rowHeaderRef, colHeaderRef)
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
      class="flex flex-col overflow-hidden"
    >
      <div class="m-4">
        <Toolbar />
      </div>
      <FormulaBar ref="formulaBarRef" />
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
            @scroll="syncScroll"
          />
        </div>
        <div class="flex overflow-hidden">
          <RowHeader
            ref="rowHeaderRef"
            @scroll="syncScroll"
          />
          <DataGrid
            ref="dataGridRef"
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
      <FooterBar />
    </div>
    <SidePanel />
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
