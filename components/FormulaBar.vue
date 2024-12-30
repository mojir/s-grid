<script setup lang="ts">
import type { Project } from '~/lib/project/Project'
import { hs } from '~/lib/utils'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const selectionLabel = computed(() => {
  if (grid.value.editor.editing.value) {
    return grid.value.position.value.toStringWithoutGrid()
  }
  if (grid.value.selection.selectedRange.value.size() === 1) {
    return grid.value.selection.selectedRange.value.start.toStringWithoutGrid()
  }
  return grid.value.selection.selectedRange.value.toStringWithoutGrid()
})

const inputValue = computed(() => {
  return grid.value.currentCell.value.input.value
})
</script>

<template>
  <div
    class="overflow-hiddent flex dark:bg-slate-900 bg-white border-t dark:border-slate-800 border-gray-300 items-center"
    :style="hs(32)"
  >
    <div
      :style="hs(20)"
      class="overflow-hidden items-center flex flex-1"
    >
      <div
        :style="hs(20)"
        class="flex pl-2 border-r dark:border-slate-600 border-gray-400 text-sm pr-4 min-w-24 whitespace-nowrap"
      >
        {{ selectionLabel }}
      </div>
      <div
        class="ml-4 select-none"
      >
        &lambda;
      </div>
      <div
        class="w-full py-1 px-2 bg-transparent dark:text-slate-300 text-gray-700 text-sm border-none focus:outline-none select-text"
      >
        {{ inputValue }}
      </div>
    </div>
  </div>
</template>
