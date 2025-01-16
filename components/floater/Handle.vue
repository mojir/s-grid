<script setup lang="ts">
const props = defineProps<{
  x: number
  y: number
}>()

const { x, y } = toRefs(props)
</script>

<template>
  <div
    class="absolute"
    :style="{
      top: `${y - 3}px`,
      left: `${x - 3}px`,
    }"
  >
    <svg
      x="0"
      y="0"
      width="6"
      height="6"
    >
      <rect
        :x="0"
        :y="0"
        width="6"
        height="6"
        fill="blue"
      />
    </svg>
  </div>
</template>
