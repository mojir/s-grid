<script setup lang="ts">
import { colorPalette } from '~/lib/color'

const { grid } = useGrid()
</script>

<template>
  <div>
    <ColorPicker
      :model-value="grid.getTextColor()"
      :color-palette="colorPalette"
      icon="mdi-format-color-text"
      @update:model-value="grid.setTextColor($event)"
    />
  </div>
</template>
