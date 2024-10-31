<script setup lang="ts">
import { ref } from 'vue'
import { useGrid } from '@/composables/useGrid'

const { grid } = useGrid()

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    ref="el"
    class="flex overflow-y-auto dark:bg-slate-800 bg-gray-200 no-scrollbar"
  >
    <ColHeaderCell
      v-for="col of grid.cols"
      :key="col.id"
      :col="col"
    />
  </div>
</template>
