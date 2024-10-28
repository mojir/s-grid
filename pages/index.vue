<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const {
  grid,
  moveActiveCell,
  moveActiveCellTo,
  setSelection,
  resetSelection,
  expandSelection,
  selection,
} = useGrid()

const { editingLitsCode, editorFocused } = useEditor()
const sheetViewRef = ref<HTMLDivElement>()
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
  const cellId = target?.id
  if (isCellId(cellId)) {
    mouseDownStart.value = cellId
    if (editingLitsCode.value) {
      setSelection(cellId)
    }
    else {
      resetSelection()
      moveActiveCellTo(cellId)
    }
  }
}
function onMouseMove(event: Event) {
  const target = event.target as HTMLElement | undefined

  if (mouseDownStart.value) {
    if (isCellId(target?.id)) {
      setSelection(`${mouseDownStart.value}-${target.id}`)
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

function onCellClick(id: string) {
  if (editingLitsCode.value) {
    setSelection(id)
  }
  else {
    resetSelection()
    moveActiveCellTo(id)
  }
}

function onKeyDown(e: KeyboardEvent) {
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
    if (e.shiftKey) {
      moveActiveCell('up')
    }
    else {
      moveActiveCell('down')
    }
  }
  else if (e.key === 'Escape') {
    formulaBarRef.value.save()
  }
  else if (e.key === 'Backspace') {
    if (!editorFocused.value) {
      grid.value.clear(selection.value)
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
        moveActiveCell('left')
      }
      else {
        moveActiveCell('right')
      }
    }
  }
}

const syncScroll = useSyncScroll(dataGridRef, rowHeaderRef, colHeaderRef)
</script>

<template>
  <div
    ref="sheetViewRef"
    class="flex flex-grow flex-col overflow-hidden h-screen bg-slate-900 text-slate-300"
  >
    <HeaderBar />
    <div
      ref="gridWrapper"
      class="flex flex-col overflow-hidden"
    >
      <FormulaBar ref="formulaBarRef" />
      <div
        class="flex"
        :style="hs(grid.colHeaderHeight)"
      >
        <div
          class="flex bg-slate-800 box-border border-b border-r border-slate-700"
          :style="whs(grid.rowHeaderWidth, grid.colHeaderHeight)"
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
          @cell-click="onCellClick"
        />
      </div>
    </div>
    <FooterBar />
  </div>
</template>
