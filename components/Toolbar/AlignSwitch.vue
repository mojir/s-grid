<script setup lang="ts">
import type { StyleAlign } from '~/lib/CellStyle'

const grid = useGrid()

const { selection } = useSelection()

const align = ref<StyleAlign>()

watch(selection, (newSelection) => {
  align.value = grid.value.getStyle('align', newSelection)
}, { immediate: true })

function onUpdateTop(value: boolean) {
  align.value = value ? 'top' : undefined
  grid.value.setStyle('align', align.value)
}

function onUpdateMiddle(value: boolean) {
  align.value = value ? 'middle' : undefined
  grid.value.setStyle('align', align.value)
}

function onUpdateBottom(value: boolean) {
  align.value = value ? 'bottom' : undefined
  grid.value.setStyle('align', align.value)
}
</script>

<template>
  <div class="flex gap-1">
    <Toggle
      variant="outline"
      :pressed="align === 'top'"
      @update:pressed="onUpdateTop"
    >
      <Icon
        name="mdi:format-vertical-align-top"
        class="w-5 h-5"
      />
    </Toggle>
    <Toggle
      variant="outline"
      :pressed="align === 'middle'"
      @update:pressed="onUpdateMiddle"
    >
      <Icon
        name="mdi:format-vertical-align-center"
        class="w-5 h-5"
      />
    </Toggle>
    <Toggle
      variant="outline"
      :pressed="align === 'bottom'"
      @update:pressed="onUpdateBottom"
    >
      <Icon
        name="mdi:format-vertical-align-bottom"
        class="w-5 h-5"
      />
    </Toggle>
  </div>
</template>
