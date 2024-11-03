<script setup lang="ts">
const { grid } = useGrid()

const cellId = computed(() => grid.value.activeCellId.value)

const bold = ref(false)

watch(cellId, (newCellId) => {
  const cell = grid.value.getCell(newCellId)
  console.log('cellId', cell?.cellId.id, cell?.style.value.bold)
  bold.value = cell?.style.value.bold ?? false
})

function onUpdateBold(value: boolean) {
  grid.value.getOrCreateCell(cellId.value).style.value.bold = value
  bold.value = value
}
</script>

<template>
  <ToggleButton
    :model-value="bold"
    icon-name="mdi:format-bold"
    @update:model-value="onUpdateBold"
  />
</template>
