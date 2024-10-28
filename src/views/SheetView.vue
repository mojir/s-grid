<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { useSyncScroll } from '@/composables/useSyncScroll'
import { onMounted, onUnmounted, ref } from 'vue'
import { wh, h } from '@/utils/cssUtils'
import DataGrid from '@/components/DataGrid.vue'
import RowHeader from '@/components/RowHeader.vue'
import ColHeader from '@/components/ColHeader.vue'
import HeaderBar from '@/components/HeaderBar.vue'
import FormulaBar from '@/components/FormulaBar.vue'
import FooterBar from '@/components/FooterBar.vue'
import { isCellId } from '@/utils/cellId'

const {
  grid,
  moveActiveCell,
  moveActiveCellTo,
  setSelection,
  resetSelection,
  expandSelection,
} = useGrid()

const editLits = ref(false)
const sheetViewRef = ref<HTMLDivElement>()
const gridWrapper = ref<HTMLDivElement>()
const dataGridRef = ref<typeof DataGrid>()
const rowHeaderRef = ref<typeof RowHeader>()
const colHeaderRef = ref<typeof ColHeader>()
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
    if (editLits.value) {
      setSelection(cellId)
    } else {
      resetSelection()
      moveActiveCellTo(cellId)
    }
  }
}
function onMouseMove(event: Event) {
  const target = event.target as HTMLElement | undefined

  if (mouseDownStart.value) {
    if (isCellId(target?.id)) {
      setSelection(`${mouseDownStart.value}:${target.id}`)
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
  if (editLits.value) {
    setSelection(id)
  } else {
    resetSelection()
    moveActiveCellTo(id)
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key.length === 1) {
    if (!formulaBarRef.value.hasFocus()) {
      formulaBarRef.value.focus()
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (formulaBarRef.value.hasFocus()) {
      formulaBarRef.value.save()
    }
    if (e.shiftKey) {
      moveActiveCell('up', { withinSelection: true })
    } else {
      moveActiveCell('down', { withinSelection: true })
    }
  } else if (e.key === 'Escape') {
    formulaBarRef.value.save()
  } else if (e.key === 'Backspace') {
    if (!formulaBarRef.value.hasFocus()) {
      grid.value.clearActiveCell()
      formulaBarRef.value.update('')
    }
  } else if (e.key === 'F2') {
    if (!formulaBarRef.value.hasFocus()) {
      formulaBarRef.value.focus()
    }
  }

  if (!editLits.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        expandSelection('down')
      } else {
        moveActiveCell('down')
        resetSelection()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        expandSelection('up')
      } else {
        moveActiveCell('up')
        resetSelection()
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        expandSelection('right')
      } else {
        moveActiveCell('right')
        resetSelection()
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        expandSelection('left')
      } else {
        moveActiveCell('left')
        resetSelection()
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      formulaBarRef.value.save()
      if (e.shiftKey) {
        moveActiveCell('left', { withinSelection: true })
      } else {
        moveActiveCell('right', { withinSelection: true })
      }
    }
  }
}

const syncScroll = useSyncScroll(dataGridRef, rowHeaderRef, colHeaderRef)
</script>

<template>
  <div
    class="flex flex-grow flex-col overflow-hidden h-screen bg-slate-900 text-slate-300"
    ref="sheetViewRef"
  >
    <HeaderBar />
    <div
      class="flex flex-col overflow-hidden"
      ref="gridWrapper"
    >
      <FormulaBar
        ref="formulaBarRef"
        @edit-lits="editLits = $event"
      />
      <div
        class="flex"
        :style="h(grid.colHeaderHeight)"
      >
        <div
          class="flex bg-slate-800 box-border border-b border-r border-slate-700"
          :style="wh(grid.rowHeaderWidth, grid.colHeaderHeight)"
        ></div>
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
