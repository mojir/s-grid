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
    ref="el"
    class="flex flex-col overflow-x-auto bg-slate-800 no-scrollbar"
    :style="dim(grid.rowHeaderWidth, null)"
  >
    <div
      v-for="row of grid.rows"
      :key="row.id"
      :style="dim(grid.rowHeaderWidth, row.height)"
      class="flex flex-col justify-center items-center text-xs"
    >
      <div
        :style="dim(null, 5)"
        class="flex w-full"
      />
      <div
        class="flex flex-1 overflow-hidden justify-center text-xs items-center select-none"
      >
        {{ row.id }}
      </div>
      <div
        :style="dim(null, 5)"
        class="flex w-full box-border border-y-2 border-slate-800 bg-slate-700 hover:cursor-row-resize mb-[-2px] z-10"
      />
    </div>
  </div>
</template>
