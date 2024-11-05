<script setup lang="ts">
const { grid } = useGrid()

const { selection } = useSelection()
const italic = ref<boolean>()

watch(selection, (newSelection) => {
  italic.value = grid.value.getStyle('italic', newSelection) ?? undefined
}, { immediate: true })

function onUpdateItalic(value: boolean) {
  grid.value.setStyle('italic', value)
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
