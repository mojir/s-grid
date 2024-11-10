<script setup lang="ts">
const grid = useGrid()

const { selection } = useSelection()
const bold = ref<boolean>()

watch(selection, (newSelection) => {
  bold.value = grid.value.getStyle('bold', newSelection)
}, { immediate: true })

function onUpdateBold(value: boolean) {
  grid.value.setStyle('bold', value)
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
