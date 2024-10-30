<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { CellId } from '~/lib/CellId'
import { Col } from '~/lib/Col'
import { Row } from '~/lib/Row'

const {
  grid,
  moveActiveCell,
  moveActiveCellTo,
  selectCell,
  selectAll,
  selectRange,
  selectRowRange,
  selectColRange,
  resetSelection,
  expandSelection,
  selection,
} = useGrid()

const { sidePanelHandleKeyDown } = useSidePanel()

const { editingLitsCode, editorFocused } = useEditor()
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
      selectCell(id)
    }
    else {
      resetSelection()
      moveActiveCellTo(id)
    }
  }
  if (Col.isColString(id)) {
    mouseDownStart.value = id
    const col = grid.value.getCol(id)
    if (col) {
      resetSelection()
      if (!editingLitsCode.value) {
        moveActiveCellTo(`${col.id}1`)
      }
      selectColRange(col, col)
    }
  }
  if (Row.isRowString(id)) {
    mouseDownStart.value = id
    const row = grid.value.getRow(id)
    if (row) {
      resetSelection()
      if (!editingLitsCode.value) {
        moveActiveCellTo(`A${row.id}`)
      }
      selectRowRange(row, row)
    }
  }
}
function onMouseMove(event: Event) {
  const target = event.target as HTMLElement | undefined

  if (mouseDownStart.value) {
    if (CellId.isCellIdString(mouseDownStart.value) && CellId.isCellIdString(target?.id)) {
      selectRange(`${mouseDownStart.value}-${target.id}`)
    }
    else if (Col.isColString(mouseDownStart.value) && Col.isColString(target?.id)) {
      const fromCol = grid.value.getCol(mouseDownStart.value)
      const toCol = grid.value.getCol(target.id)
      if (fromCol && toCol) {
        selectColRange(fromCol, toCol)
      }
    }
    else if (Row.isRowString(mouseDownStart.value) && Row.isRowString(target?.id)) {
      const fromRow = grid.value.getRow(mouseDownStart.value)
      const toRow = grid.value.getRow(target.id)
      if (fromRow && toRow) {
        selectRowRange(fromRow, toRow)
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
  sidePanelHandleKeyDown(e)

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (!editorFocused.value) {
      formulaBarRef.value.update('')
      formulaBarRef.value.focus()
    }
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    if (editorFocused.value) {
      formulaBarRef.value.save()
    }
    resetSelection()
    if (e.shiftKey) {
      moveActiveCell('up', true)
    }
    else {
      moveActiveCell('down', true)
    }
  }
  else if (e.key === 'Escape') {
    formulaBarRef.value.cancel()
  }
  else if (e.key === 'Backspace') {
    if (!editorFocused.value) {
      grid.value.clearRange(selection.value)
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
        expandSelection('down')
      }
      else {
        moveActiveCell('down')
        resetSelection()
      }
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        expandSelection('up')
      }
      else {
        moveActiveCell('up')
        resetSelection()
      }
    }
    else if (e.key === 'ArrowRight') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        expandSelection('right')
      }
      else {
        moveActiveCell('right')
        resetSelection()
      }
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        expandSelection('left')
      }
      else {
        moveActiveCell('left')
        resetSelection()
      }
    }
    else if (e.key === 'Tab') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        moveActiveCell('left', true)
      }
      else {
        moveActiveCell('right', true)
      }
    }
  }
}

const syncScroll = useSyncScroll(dataGridRef, rowHeaderRef, colHeaderRef)
</script>

<template>
  <div
    class="flex flex-grow overflow-hidden h-screen bg-slate-900 text-slate-300"
  >
    <div
      class="flex flex-grow flex-col overflow-hidden h-screen bg-slate-900 text-slate-300"
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
            class="flex bg-slate-800 box-border border-b border-r border-slate-700"
            :style="whs(grid.rowHeaderWidth, grid.colHeaderHeight)"
            @click="selectAll"
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
