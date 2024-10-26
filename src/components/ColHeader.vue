<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { cssUtils } from '@/utils'
import { ref } from 'vue'

const { grid } = useGrid()

const { dim } = cssUtils

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    class="flex overflow-y-auto bg-slate-800 no-scrollbar"
    ref="el"
  >
    <div
      v-for="col of grid.cols"
      :key="col.id"
      :style="dim(col.width, grid.colHeaderHeight)"
      class="flex"
    >
      <div :style="dim(3, null)" />
      <div class="flex flex-1 justify-center text-xs items-center select-none">
        {{ col.id }}
      </div>
      <div
        :style="dim(5, null)"
        class="flex box-border border-x-2 border-slate-800 bg-slate-700 hover:cursor-col-resize mr-[-2px] z-10"
      />
    </div>
  </div>
</template>
