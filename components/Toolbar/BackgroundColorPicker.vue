<script setup lang="ts">
import { colorPalette } from '~/lib/color'

const grid = useGrid()
</script>

<template>
  <div>
    <ColorPicker
      :model-value="grid.getBackgroundColor()"
      :color-palette="colorPalette"
      icon="mdi-format-color-fill"
      @update:model-value="grid.setBackgroundColor($event)"
    />
  </div>
</template>
