<script setup lang="ts">
import type { WatchHandle } from 'vue'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const bold = ref<boolean>(false)

let watchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  bold.value = grid.value.getBold(newSelection) || false

  const boldRefs = newSelection.getCells().map(cell => cell.bold)

  watchHandle?.stop()
  watchHandle = watch(boldRefs, () => {
    bold.value = grid.value.getBold(newSelection) || false
  })
}, { immediate: true })

function onUpdateBold(value: boolean) {
  grid.value.setBold(value, null)
  bold.value = value
}
</script>

<template>
  <Toggle
    variant="outline"
    :pressed="bold"
    @update:pressed="onUpdateBold"
  >
    <Icon
      name="mdi:format-bold"
      class="w-5 h-5"
    />
  </Toggle>
</template>
