<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { CellId } from '~/lib/CellId'
import { Col } from '~/lib/Col'
import { Row } from '~/lib/Row'
import { whs, hs } from '~/lib/utils'

const {
  grid,
} = useGrid()

const { sidePanelHandleKeyDown } = useSidePanel()

const { editingLitsCode, editorFocused, setEditorFocused } = useEditor()
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

const mouseDownStart = ref('')
function onMouseDown(event: Event) {
  const target = event.target as HTMLElement | undefined
  const id = target?.id
  if (CellId.isCellIdString(id)) {
    mouseDownStart.value = id
    if (editingLitsCode.value) {
      grid.value.select(id)
    }
    else {
      grid.value.resetSelection()
      grid.value.movePositionTo(id)
    }
  }
  if (Col.isColString(id)) {
    mouseDownStart.value = id
    const col = grid.value.getCol(id)
    if (col) {
      grid.value.resetSelection()
      if (!editingLitsCode.value) {
        grid.value.movePositionTo(`${col.id}1`)
      }
      grid.value.selectColRange(col, col)
    }
  }
  if (Row.isRowString(id)) {
    mouseDownStart.value = id
    const row = grid.value.getRow(id)
    if (row) {
      grid.value.resetSelection()
      if (!editingLitsCode.value) {
        grid.value.movePositionTo(`A${row.id}`)
      }
      grid.value.selectRowRange(row, row)
    }
  }
}
function onMouseMove(event: Event) {
  const target = event.target as HTMLElement | undefined

  if (mouseDownStart.value) {
    if (CellId.isCellIdString(mouseDownStart.value) && CellId.isCellIdString(target?.id)) {
      grid.value.select(`${mouseDownStart.value}-${target.id}`)
    }
    else if (Col.isColString(mouseDownStart.value) && Col.isColString(target?.id)) {
      const fromCol = grid.value.getCol(mouseDownStart.value)
      const toCol = grid.value.getCol(target.id)
      if (fromCol && toCol) {
        grid.value.selectColRange(fromCol, toCol)
      }
    }
    else if (Row.isRowString(mouseDownStart.value) && Row.isRowString(target?.id)) {
      const fromRow = grid.value.getRow(mouseDownStart.value)
      const toRow = grid.value.getRow(target.id)
      if (fromRow && toRow) {
        grid.value.selectRowRange(fromRow, toRow)
      }
    }
  }
}
function onMouseUp() {
  mouseDownStart.value = ''
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
    if (grid.value.selection.value.size() === 1 && !editorFocused.value) {
      formulaBarRef.value.focus()
    }
    else {
      if (editorFocused.value) {
        formulaBarRef.value.save()
      }
      // grid.value.resetSelection()
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
      grid.value.clear(grid.value.selection.value)
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
        grid.value.expandSelection('down')
      }
      else {
        grid.value.movePosition('down')
        grid.value.resetSelection()
      }
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        grid.value.expandSelection('up')
      }
      else {
        grid.value.movePosition('up')
        grid.value.resetSelection()
      }
    }
    else if (e.key === 'ArrowRight') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        grid.value.expandSelection('right')
      }
      else {
        grid.value.movePosition('right')
        grid.value.resetSelection()
      }
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        grid.value.expandSelection('left')
      }
      else {
        grid.value.movePosition('left')
        grid.value.resetSelection()
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
          :style="hs(grid.colHeaderHeight)"
        >
          <div
            class="flex dark:bg-slate-800 bg-gray-200 box-border border-b border-r dark:border-slate-700 border-gray-300"
            :style="whs(grid.rowHeaderWidth + 1, grid.colHeaderHeight + 1)"
            @click="grid.selectAll"
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
