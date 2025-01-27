<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = project.value.currentGrid
const selection = grid.value.selection.selectedRange
const pressed = ref<boolean>()

watch(project.value.clipboard.hasStyleData, (hasData) => {
  pressed.value = hasData
}, { immediate: true })

function onUpdatePressed(value: boolean) {
  if (value) {
    project.value.clipboard.copyStyles(selection.value)
  }
  else {
    project.value.clipboard.clearStyleClipboard()
  }
}
</script>

<template>
  <Toggle
    variant="outline"
    :pressed="pressed"
    @update:pressed="onUpdatePressed"
  >
    <Icon
      name="mdi:format-paint"
      class="w-5 h-5"
    />
  </Toggle>
</template>
