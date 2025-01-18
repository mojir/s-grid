<script setup lang="ts">
import type { Rectangle } from '~/lib/layout/Rectangle'

defineProps<{
  id: string
  active: boolean
}>()

const rectangle = defineModel<Rectangle>('rectangle', {
  required: true,
})

const x = computed(() => rectangle.value.x)
const y = computed(() => rectangle.value.y)
const width = computed(() => rectangle.value.width)
const height = computed(() => rectangle.value.height)
const handleGap = 6
</script>

<template>
  <div
    :id="`${id}|handle-move`"
    class="overflow-hidden absolute border-gray-400 dark:border-slate-500 bg-grid text-primary-foreground p-2 border"
    :class="{
      'border-transparent': active,
    }"
    :style="{
      boxSizing: 'border-box',
      top: `${y}px`,
      left: `${x}px`,
      width: `${width}px`,
      height: `${height}px`,
    }"
  >
    <slot />
  </div>
  <template v-if="active">
    <!-- top left -->
    <FloaterLine
      width="thick"
      :x1="x + handleGap"
      :y1="y"
      :x2="x + width / 2 - handleGap"
      :y2="y"
    />
    <!-- top right -->
    <FloaterLine
      width="thick"
      :x1="x + width / 2 + handleGap"
      :y1="y"
      :x2="x + width - handleGap"
      :y2="y"
    />
    <!-- bottom left -->
    <FloaterLine
      width="thick"
      :x1="x + handleGap"
      :y1="y + height"
      :x2="x + width / 2 - handleGap"
      :y2="y + height"
    />
    <!-- bottom right -->
    <FloaterLine
      width="thick"
      :x1="x + width / 2 + handleGap"
      :y1="y + height"
      :x2="x + width - handleGap"
      :y2="y + height"
    />
    <!-- left top -->
    <FloaterLine
      width="thick"
      :x1="x"
      :y1="y + handleGap"
      :x2="x"
      :y2="y + height / 2 - handleGap"
    />
    <!-- left bottom -->
    <FloaterLine
      width="thick"
      :x1="x"
      :y1="y + height / 2 + handleGap"
      :x2="x"
      :y2="y + height - handleGap"
    />
    <!-- right top -->
    <FloaterLine
      width="thick"
      :x1="x + width"
      :y1="y + handleGap"
      :x2="x + width"
      :y2="y + height / 2 - handleGap"
    />
    <!-- right bottom -->
    <FloaterLine
      width="thick"
      :x1="x + width"
      :y1="y + height / 2 + handleGap"
      :x2="x + width"
      :y2="y + height - handleGap"
    />

    <FloaterHandle
      :id="`${id}|handle-nw`"
      shape="square"
      :size="6"
      class="cursor-nw-resize"
      :x="x"
      :y="y"
    />
    <FloaterHandle
      :id="`${id}|handle-n`"
      shape="square"
      :size="6"
      class="cursor-n-resize"
      :x="x + width / 2"
      :y="y"
    />
    <FloaterHandle
      :id="`${id}|handle-ne`"
      shape="square"
      :size="6"
      class="cursor-ne-resize"
      :x="x + width"
      :y="y"
    />
    <FloaterHandle
      :id="`${id}|handle-e`"
      shape="square"
      :size="6"
      class="cursor-e-resize"
      :x="x + width"
      :y="y + height / 2"
    />
    <FloaterHandle
      :id="`${id}|handle-se`"
      shape="square"
      :size="6"
      class="cursor-se-resize"
      :x="x + width"
      :y="y + height"
    />
    <FloaterHandle
      :id="`${id}|handle-s`"
      shape="square"
      :size="6"
      class="cursor-s-resize"
      :x="x + width / 2"
      :y="y + height"
    />
    <FloaterHandle
      :id="`${id}|handle-sw`"
      shape="square"
      :size="6"
      class="cursor-sw-resize"
      :x="x"
      :y="y + height"
    />
    <FloaterHandle
      :id="`${id}|handle-w`"
      shape="square"
      :size="6"
      class="cursor-w-resize"
      :x="x"
      :y="y + height / 2"
    />
  </template>
</template>
