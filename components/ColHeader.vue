<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { ws, whs } from '@/utils/cssUtils'
import { ref } from 'vue'

const { grid } = useGrid()

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    ref="el"
    class="flex overflow-y-auto bg-slate-800 no-scrollbar"
  >
    <div
      v-for="col of grid.cols"
      :key="col.label"
      :style="whs(col.width, grid.colHeaderHeight)"
      class="flex"
    >
      <div :style="ws(3)" />
      <div class="flex flex-1 justify-center text-xs items-center select-none">
        {{ col.label }}
      </div>
      <div
        :style="ws(5)"
        class="flex box-border border-x-2 border-slate-800 bg-slate-700 hover:cursor-col-resize mr-[-2px] z-10"
      />
    </div>
  </div>
</template>
