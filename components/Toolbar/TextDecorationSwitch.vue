<script setup lang="ts">
import type { StyleTextDecoration } from '~/lib/CellStyle'

const { grid } = useGrid()

const { selection } = useSelection()
const textDecoration = ref<StyleTextDecoration>()

watch(selection, (newSelection) => {
  textDecoration.value = grid.value.getStyle('textDecoration', newSelection)
}, { immediate: true })

function onUpdateUnderline(value: boolean) {
  textDecoration.value = value ? 'underline' : undefined
  grid.value.setStyle('textDecoration', textDecoration.value)
}

function onUpdateLineThrough(value: boolean) {
  textDecoration.value = value ? 'line-through' : undefined
  grid.value.setStyle('textDecoration', textDecoration.value)
}
</script>

<template>
  <div class="flex gap-1">
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
