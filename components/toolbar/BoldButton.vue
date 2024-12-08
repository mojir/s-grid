<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const bold = ref<boolean>()

watch(grid.value.selection.selectedRange, (newSelection) => {
  bold.value = grid.value.getStyle('bold', newSelection)
}, { immediate: true })

function onUpdateBold(value: boolean) {
  grid.value.setStyle('bold', value, null)
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
