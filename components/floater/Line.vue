<script setup lang="ts">
const props = defineProps<{
  x1: number
  y1: number
  x2: number
  y2: number
  width: 'thin' | 'thick'
}>()

const { x1, y1, x2, y2, width } = toRefs(props)
const gap = 2
</script>

<template>
  <div
    class="absolute overflow-visible"
    :style="{
      top: `${y1 - gap}px`,
      left: `${x1 - gap}px`,
    }"
  >
    <svg
      :x="0"
      :y="0"
      :width="x2 - x1 + 2 * gap"
      :height="y2 - y1 + 2 * gap"
    >
      <line
        :x1="gap"
        :y1="gap"
        :x2="x2 - x1 + gap"
        :y2="y2 - y1 + gap"
        :stroke-width="width === 'thin' ? 1 : 2"
        stroke="rgb(59, 129, 246)"
      />
    </svg>
  </div>
</template>
