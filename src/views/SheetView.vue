<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { useSyncScroll } from '@/composables/useSyncScroll'
import { onMounted, onUnmounted, ref } from 'vue'
import { cssUtils } from '@/utils'
import DataGrid from '@/components/DataGrid.vue'
import RowHeader from '@/components/RowHeader.vue'
import ColHeader from '@/components/ColHeader.vue'
import HeaderBar from '@/components/HeaderBar.vue'
import FormulaBar from '@/components/FormulaBar.vue'
import FooterBar from '@/components/FooterBar.vue'

const { grid, move } = useGrid()
const { wh, h } = cssUtils

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})

const dataGridRef = ref<typeof DataGrid>()
const rowHeaderRef = ref<typeof RowHeader>()
const colHeaderRef = ref<typeof ColHeader>()
const gridWrapper = ref<HTMLDivElement>()
const formulaBarRef = ref()

function onKeyDown(e: KeyboardEvent) {
  if (e.key.length === 1) {
    if (!formulaBarRef.value.hasFocus()) {
      formulaBarRef.value.focus()
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    formulaBarRef.value.save()
    move('down')
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    formulaBarRef.value.save()
    move('up')
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    formulaBarRef.value.save()
    move('right')
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    formulaBarRef.value.save()
    move('left')
  } else if (e.key === 'Tab') {
    e.preventDefault()
    formulaBarRef.value.save()
    if (e.shiftKey) {
      move('left')
    } else {
      move('right')
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (formulaBarRef.value.hasFocus()) {
      formulaBarRef.value.save()
      move('down')
    } else {
      formulaBarRef.value.focus()
    }
  } else if (e.key === 'Escape') {
    formulaBarRef.value.cancel()
  } else if (e.key === 'Backspace') {
    if (!formulaBarRef.value.hasFocus()) {
      grid.value.clearActiveCell()
      formulaBarRef.value.update('')
    }
  }
}

const syncScroll = useSyncScroll(dataGridRef, rowHeaderRef, colHeaderRef)
</script>

<template>
  <div
    class="flex flex-grow flex-col overflow-hidden h-screen bg-slate-900 text-slate-300"
  >
    <HeaderBar />
    <div
      class="flex flex-col overflow-hidden"
      ref="gridWrapper"
    >
      <FormulaBar ref="formulaBarRef" />
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
          @cell-dblclick="formulaBarRef.focus()"
        />
      </div>
    </div>
    <FooterBar />
  </div>
</template>
