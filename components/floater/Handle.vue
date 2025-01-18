<script setup lang="ts">
const props = defineProps<{
  x: number
  y: number
  size: number
  shape: 'plus' | 'square'
}>()

const { x, y } = toRefs(props)
</script>

<template>
  <div
    class="absolute"
    :style="{
      top: `${y - size / 2}px`,
      left: `${x - size / 2}px`,
    }"
    @dragstart.prevent
  >
    <svg
      x="0"
      y="0"
      :width="size"
      :height="size"
    >
      <rect
        v-if="shape === 'square'"
        :x="0"
        :y="0"
        :width="size"
        :height="size"
        fill="blue"
      />
      <line
        v-if="shape === 'plus'"
        :x1="0"
        :y1="size / 2"
        :x2="size"
        :y2="size / 2"
        stroke="blue"
        stroke-width="2"
      />
      <line
        v-if="shape === 'plus'"
        :x1="size / 2"
        :y1="0"
        :x2="size / 2"
        :y2="size"
        stroke="blue"
        stroke-width="2"
      />
    </svg>
  </div>
</template>
