<script setup lang="ts">
import { colorPalette } from '~/lib/color'

const { grid } = useGrid()
</script>

<template>
  <ColorPicker
    title="Background color"
    :color-palette="colorPalette"
    @color="grid.setBackgroundColor($event)"
  >
    <Button
      variant="outline"
      size="icon"
    >
      <Icon
        class="h-6 w-6"
        name="mdi-format-color-fill"
      />
    </Button>
  </ColorPicker>
</template>
