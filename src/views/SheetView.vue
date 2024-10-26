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

const { grid, fromIdToCoords, fromCoordsToId } = useGrid()
const activeCellId = ref<string>('A1')
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
    const [row, col] = fromIdToCoords(activeCellId.value)
    const nextRow = row + 1
    formulaBarRef.value.save()
    if (nextRow < grid.value.rows.length) {
      activeCellId.value = fromCoordsToId(nextRow, col)
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    formulaBarRef.value.save()
    const [row, col] = fromIdToCoords(activeCellId.value)
    const nextRow = row - 1
    if (nextRow >= 0) {
      activeCellId.value = fromCoordsToId(nextRow, col)
    }
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    formulaBarRef.value.save()
    const [row, col] = fromIdToCoords(activeCellId.value)
    const nextCol = col + 1
    if (nextCol < grid.value.cols.length) {
      activeCellId.value = fromCoordsToId(row, nextCol)
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    formulaBarRef.value.save()
    const [row, col] = fromIdToCoords(activeCellId.value)
    const nextCol = col - 1
    if (nextCol >= 0) {
      activeCellId.value = fromCoordsToId(row, nextCol)
    }
  } else if (e.key === 'Tab') {
    e.preventDefault()
    formulaBarRef.value.save()
    if (e.shiftKey) {
      const [row, col] = fromIdToCoords(activeCellId.value)
      const nextCol = col - 1
      if (nextCol >= 0) {
        activeCellId.value = fromCoordsToId(row, nextCol)
      }
    } else {
      const [row, col] = fromIdToCoords(activeCellId.value)
      const nextCol = col + 1
      if (nextCol < grid.value.cols.length) {
        activeCellId.value = fromCoordsToId(row, nextCol)
      }
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (formulaBarRef.value.hasFocus()) {
      formulaBarRef.value.save()
      const [row, col] = fromIdToCoords(activeCellId.value)
      const nextRow = row + 1
      if (nextRow < grid.value.rows.length) {
        activeCellId.value = fromCoordsToId(nextRow, col)
      }
    } else {
      formulaBarRef.value.focus()
    }
  } else if (e.key === 'Escape') {
    formulaBarRef.value.cancel()
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
      <FormulaBar
        :active-cell-id="activeCellId"
        ref="formulaBarRef"
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
          v-model:active-cell-id="activeCellId"
          ref="dataGridRef"
          @scroll="syncScroll"
          @cell-dblclick="formulaBarRef.focus()"
        />
      </div>
    </div>
    <FooterBar />
  </div>
</template>
