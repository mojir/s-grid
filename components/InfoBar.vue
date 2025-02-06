<script setup lang="ts">
import { isLitsError } from '@mojir/lits'
import { computed } from 'vue'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = project.value.currentGrid

const errorMessage = computed(() => {
  const error = grid.value.currentCell.value.error.value
  if (error) {
    if (isLitsError(error)) {
      return error.message
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (error as any)?.message

    if (typeof message === 'string') {
      return message || 'Unknown error'
    }

    return `${error}`
  }
  return null
})

const hasContent = computed(() => !!errorMessage.value)
</script>

<template>
  <div
    v-if="hasContent"
    class="px-4 flex h-auto items-center text-sm justify-between dark:bg-slate-900 bg-white box-border border-t dark:border-slate-700 border-gray-300"
  >
    <div
      v-if="errorMessage"
      class="whitespace-pre flex-1 text-red-500 py-2 max-h-40 overflow-auto font-mono"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
