<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const italic = ref<boolean>(false)

watch(grid.value.selection.selectedRange, (newSelection) => {
  italic.value = grid.value.getItalic(newSelection) ?? false
}, { immediate: true })

function onUpdateItalic(value: boolean) {
  grid.value.setItalic(value, null)
  italic.value = value
}
</script>

<template>
  <Toggle
    variant="outline"
    :pressed="italic"
    @update:pressed="onUpdateItalic"
  >
    <Icon
      name="mdi:format-italic"
      class="w-5 h-5"
    />
  </Toggle>
</template>
