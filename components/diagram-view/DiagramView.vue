<script setup lang="ts">
import type { Diagram } from '~/lib/Diagram'
import { Rectangle } from '~/lib/layout/Rectangle'

const props = defineProps<{
  diagram: Diagram
}>()

const { diagram } = toRefs(props)

const x = computed(() => {
  const rectangle = Rectangle.fromReference(diagram.value.anchor)
  return rectangle.x + diagram.value.offsetX
})

const y = computed(() => {
  const rectangle = Rectangle.fromReference(diagram.value.anchor)
  return rectangle.y + diagram.value.offsetY
})

const values = computed(() => {
  return diagram.value.dataReference.value.getCells().map(cell => cell.output.value)
})

const width = computed(() => {
  return diagram.value.width
})

const height = computed(() => {
  return diagram.value.height
})
</script>

<template>
  <div
    class="overflow-hidden absolute border border-gray-400 dark:border-slate-500 bg-grid text-primary-foreground p-2"
    :style="{
      top: `${y}px`,
      left: `${x}px`,
      width: `${width}px`,
      height: `${height}px`,
    }"
  >
    <div
      v-if="diagram.title"
      class="font-bold text-lg"
    >
      {{ diagram.title }}
    </div>
    <div class="flex flex-wrap flex-row gap-4">
      <div
        v-for="(value, index) in values"
        :key="index"
        class="text-sm"
      >
        {{ value }}
      </div>
    </div>
  </div>
</template>
