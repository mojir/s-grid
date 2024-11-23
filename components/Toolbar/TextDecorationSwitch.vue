<script setup lang="ts">
import type { StyleTextDecoration } from '~/lib/CellStyle'
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)
const grid = gridProject.value.currentGrid

const textDecoration = ref<StyleTextDecoration>()

watch(grid.value.selection.selectedRange, (newSelection) => {
  textDecoration.value = grid.value.getStyle('textDecoration', newSelection)
}, { immediate: true })

function onUpdateUnderline(value: boolean) {
  textDecoration.value = value ? 'underline' : undefined
  grid.value.setStyle('textDecoration', textDecoration.value, null)
}

function onUpdateLineThrough(value: boolean) {
  textDecoration.value = value ? 'line-through' : undefined
  grid.value.setStyle('textDecoration', textDecoration.value, null)
}
</script>

<template>
  <div class="flex gap-0.5">
    <Toggle
      variant="outline"
      :pressed="textDecoration === 'underline'"
      @update:pressed="onUpdateUnderline"
    >
      <Icon
        name="mdi:format-underline"
        class="w-5 h-5"
      />
    </Toggle>

    <Toggle
      variant="outline"
      :pressed="textDecoration === 'line-through'"
      @update:pressed="onUpdateLineThrough"
    >
      <Icon
        name="mdi:format-strikethrough-variant"
        class="w-5 h-5"
      />
    </Toggle>
  </div>
</template>
