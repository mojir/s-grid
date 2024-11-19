<script setup lang="ts">
const grid = useCurrentGrid()
const pressed = ref<boolean>()

watch(grid.value.clipboard.hasStyleData, (hasData) => {
  pressed.value = hasData
}, { immediate: true })

function onUpdatePressed(value: boolean) {
  if (value) {
    grid.value.clipboard.copyStyleSelection()
  }
  else {
    grid.value.clipboard.clearStyleClipboard()
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
