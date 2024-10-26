<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { useSyncScroll } from '@/composables/useSyncScroll'
import { ref } from 'vue'
import { cssUtils } from '@/utils'
import DataGrid from '@/components/DataGrid.vue'
import RowHeader from './RowHeader.vue'
import ColHeader from './ColHeader.vue'

const { grid } = useGrid()
const activeCellId = defineModel('activeCellId', {
  type: String,
  required: true,
})

const { wh, h } = cssUtils

const dataGridRef = ref<typeof DataGrid>()
const rowHeaderRef = ref<typeof RowHeader>()
const colHeaderRef = ref<typeof ColHeader>()

const syncScroll = useSyncScroll(dataGridRef, rowHeaderRef, colHeaderRef)
</script>

<template>
  <div class="flex flex-grow flex-col overflow-hidden">
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
      />
    </div>
  </div>
</template>
