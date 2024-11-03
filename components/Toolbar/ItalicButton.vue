<script setup lang="ts">
const { grid } = useGrid()

const cellId = computed(() => grid.value.position.value)

const italic = ref(false)

watch(cellId, (newCellId) => {
  italic.value = grid.value.getCell(newCellId).style.value.italic
})

function onUpdateBold(value: boolean) {
  grid.value.setStyle('italic', value)
  italic.value = value
}
</script>

<template>
  <ToggleButton
    :model-value="italic"
    icon-name="mdi:format-italic"
    @update:model-value="onUpdateBold"
  />
</template>
