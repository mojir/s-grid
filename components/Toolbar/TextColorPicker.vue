<script setup lang="ts">
import { colorPalette } from '~/lib/color'

const { grid } = useGrid()
</script>

<template>
  <ColorPicker
    :color-palette="colorPalette"
    title="Text color"
    @color="grid.setTextColor($event)"
  >
    <Button
      variant="outline"
      size="icon"
    >
      <Icon
        class="h-6 w-6"
        name="mdi-format-color-text"
      />
    </Button>
  </ColorPicker>
</template>
