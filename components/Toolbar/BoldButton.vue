<script setup lang="ts">
const { grid } = useGrid()

const cellId = computed(() => grid.value.position.value)

const bold = ref(false)

watch(cellId, (newCellId) => {
  bold.value = grid.value.getCell(newCellId).style.value.bold
})

function onUpdateBold(value: boolean) {
  grid.value.setStyle('bold', value)
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
