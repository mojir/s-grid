<script setup lang="ts">
import { isLitsError } from '@mojir/lits'
import { computed } from 'vue'
import { useGrid } from '@/composables/useGrid'

const { grid } = useGrid()
const { rowHeaderWidth } = useRowsAndCols()

const errorMessage = computed(() => {
  const cell = grid.value.getCurrentCell()
  const output = cell?.output.value
  if (output instanceof Error) {
    if (isLitsError(output)) {
      return output.shortMessage
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (output as any)?.message

    if (typeof message === 'string') {
      return message || 'Unknown error'
    }

    return `${output}`
  }
  return null
})
</script>

<template>
  <div
    :style="{
      paddingLeft: `${rowHeaderWidth + 5}px`,
    }"
    class="truncate flex h-12 dark:bg-slate-800 bg-gray-200 box-border border-t dark:border-slate-700 border-gray-300 items-center px-2 text-sm justify-between"
  >
    <div
      v-if="errorMessage"
      class="flex-1 text-red-500"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
