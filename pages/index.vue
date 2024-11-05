<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { CellId } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import { Col } from '~/lib/Col'
import { Row } from '~/lib/Row'
import { whs, hs } from '~/lib/utils'

const { grid } = useGrid()
const selection = useSelection()
const { colHeaderHeight, rowHeaderWidth } = useRowsAndCols()
const { sidePanelHandleKeyDown } = useSidePanel()
const { editingLitsCode, editorFocused, setEditorFocused } = useEditor()
const { getRow, getCol } = useRowsAndCols()

const gridWrapper = ref<HTMLDivElement>()
const dataGridRef = ref()
const rowHeaderRef = ref()
const colHeaderRef = ref()
const formulaBarRef = ref()

onMounted(() => {
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mouseleave', onMouseLeave)
  window.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('keydown', onKeyDown)
})

function resetSelection() {
  selection.updateSelection(CellRange.fromSingleCellId(grid.value.position.value))
}

const mouseDownStart = ref('')

function onMouseDown(event: Event) {
  const target = event.target as HTMLElement | undefined
  const id = target?.id
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
  if (Col.isColString(id)) {
    selection.selecting.value = true
    mouseDownStart.value = id
    const col = getCol(id)
    if (col) {
      resetSelection()
      if (!editingLitsCode.value) {
        grid.value.movePositionTo(`${col.id}1`)
      }
      selection.selectColRange(col, col)
    }
  }
  if (Row.isRowString(id)) {
    selection.selecting.value = true
    mouseDownStart.value = id
    const row = getRow(id)
    if (row) {
      resetSelection()
      if (!editingLitsCode.value) {
        grid.value.movePositionTo(`A${row.id}`)
      }
      selection.selectRowRange(row, row)
    }
  }
}
function onMouseMove(event: Event) {
  const target = event.target as HTMLElement | undefined

  if (mouseDownStart.value) {
    if (CellId.isCellIdString(mouseDownStart.value) && CellId.isCellIdString(target?.id)) {
      selection.select(`${mouseDownStart.value}-${target.id}`)
    }
    else if (Col.isColString(mouseDownStart.value) && Col.isColString(target?.id)) {
      const fromCol = getCol(mouseDownStart.value)
      const toCol = getCol(target.id)
      if (fromCol && toCol) {
        selection.selectColRange(fromCol, toCol)
      }
    }
    else if (Row.isRowString(mouseDownStart.value) && Row.isRowString(target?.id)) {
      const fromRow = getRow(mouseDownStart.value)
      const toRow = getRow(target.id)
      if (fromRow && toRow) {
        selection.selectRowRange(fromRow, toRow)
      }
    }
  }
}
function onMouseUp() {
  mouseDownStart.value = ''
  selection.selecting.value = false
}

function onMouseLeave() {
  mouseDownStart.value = ''
}

function onCellDblclick() {
  formulaBarRef.value.focus()
}

function onKeyDown(e: KeyboardEvent) {
  console.log('key', e.key)
  if (sidePanelHandleKeyDown(e)) {
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (!editorFocused.value) {
      formulaBarRef.value.update('')
      formulaBarRef.value.focus()
    }
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    if (selection.selection.value.size() === 1 && !editorFocused.value) {
      formulaBarRef.value.focus()
    }
    else {
      if (editorFocused.value) {
        formulaBarRef.value.save()
      }
      // resetSelection()
      if (e.shiftKey) {
        grid.value.movePosition('up', true)
      }
      else {
        grid.value.movePosition('down', true)
      }
    }
  }
  else if (e.key === 'Escape') {
    formulaBarRef.value.cancel()
    setEditorFocused(false)
  }
  else if (e.key === 'Backspace') {
    if (!editorFocused.value) {
      grid.value.clear(selection.selection.value)
      formulaBarRef.value.update('')
    }
  }
  else if (e.key === 'F2') {
    if (!editorFocused.value) {
      formulaBarRef.value.focus()
    }
  }

  if (!editingLitsCode.value) {
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
}

const syncScroll = useSyncScroll(dataGridRef, rowHeaderRef, colHeaderRef)
</script>

<template>
  <div
    class="flex flex-grow overflow-hidden h-screen dark:bg-slate-900 bg-gray-100 dark:text-slate-300 text-gray-700"
  >
    <div
      class="flex flex-grow flex-col overflow-hidden h-screen dark:bg-slate-900 bg-gray-100 dark:text-slate-300 text-gray-700"
    >
      <HeaderBar />
      <div
        ref="gridWrapper"
        class="flex flex-grow flex-col overflow-hidden"
      >
        <FormulaBar ref="formulaBarRef" />
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
        </div>
      </div>
      <FooterBar />
    </div>
    <SidePanel />
  </div>
</template>
