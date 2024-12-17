<script setup lang="ts">
import type { StyleTextDecoration } from '~/dto/CellDTO'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const textDecoration = ref<StyleTextDecoration>('none')

watch(grid.value.selection.selectedRange, (newSelection) => {
  textDecoration.value = grid.value.getTextDecoration(newSelection) ?? 'none'
}, { immediate: true })

function onUpdateUnderline(value: boolean) {
  textDecoration.value = value ? 'underline' : 'none'
  grid.value.setTextDecoration(textDecoration.value, null)
}

function onUpdateLineThrough(value: boolean) {
  textDecoration.value = value ? 'line-through' : 'none'
  grid.value.setTextDecoration(textDecoration.value, null)
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
