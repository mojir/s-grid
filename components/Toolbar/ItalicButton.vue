<script setup lang="ts">
const { grid } = useGrid()

const cellId = computed(() => grid.value.activeCellId.value)

const italic = ref(false)

watch(cellId, (newCellId) => {
  const cell = grid.value.getCell(newCellId)
  console.log('cellId', cell?.cellId.id, cell?.style.value.italic)
  italic.value = cell?.style.value.italic ?? false
})

function onUpdateBold(value: boolean) {
  grid.value.getOrCreateCell(cellId.value).style.value.italic = value
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
