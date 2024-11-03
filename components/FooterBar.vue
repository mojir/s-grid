<script setup lang="ts">
import { isLitsError } from '@mojir/lits'
import { computed } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { hs } from '@/utils/cssUtils'

const { grid } = useGrid()
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
    :style="hs(30)"
    class="flex dark:bg-slate-800 bg-gray-200 box-border border-t dark:border-slate-700 border-gray-300 items-center px-2 text-sm justify-between"
  >
    <div>
      <div
        v-if="errorMessage"
        class="flex-1 text-red-500"
      >
        Error: {{ errorMessage }}
      </div>
    </div>
  </div>
</template>
