<script setup lang="ts">
import type { Rectangle } from '~/lib/layout/Rectangle'

defineProps<{
  diagramId: string
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
  <!-- top left -->
  <DiagramViewFrameLine
    :x1="x + handleGap"
    :y1="y"
    :x2="x + width / 2 - handleGap"
    :y2="y"
  />
  <!-- top right -->
  <DiagramViewFrameLine
    :x1="x + width / 2 + handleGap"
    :y1="y"
    :x2="x + width - handleGap"
    :y2="y"
  />
  <!-- bottom left -->
  <DiagramViewFrameLine
    :x1="x + handleGap"
    :y1="y + height"
    :x2="x + width / 2 - handleGap"
    :y2="y + height"
  />
  <!-- bottom right -->
  <DiagramViewFrameLine
    :x1="x + width / 2 + handleGap"
    :y1="y + height"
    :x2="x + width - handleGap"
    :y2="y + height"
  />
  <!-- left top -->
  <DiagramViewFrameLine
    :x1="x"
    :y1="y + handleGap"
    :x2="x"
    :y2="y + height / 2 - handleGap"
  />
  <!-- left bottom -->
  <DiagramViewFrameLine
    :x1="x"
    :y1="y + height / 2 + handleGap"
    :x2="x"
    :y2="y + height - handleGap"
  />
  <!-- right top -->
  <DiagramViewFrameLine
    :x1="x + width"
    :y1="y + handleGap"
    :x2="x + width"
    :y2="y + height / 2 - handleGap"
  />
  <!-- right bottom -->
  <DiagramViewFrameLine
    :x1="x + width"
    :y1="y + height / 2 + handleGap"
    :x2="x + width"
    :y2="y + height - handleGap"
  />

  <DiagramViewFrameHandle
    :id="`${diagramId}|handle-nw`"
    class="cursor-nw-resize"
    :x="x"
    :y="y"
  />
  <DiagramViewFrameHandle
    :id="`${diagramId}|handle-n`"
    class="cursor-n-resize"
    :x="x + width / 2"
    :y="y"
  />
  <DiagramViewFrameHandle
    :id="`${diagramId}|handle-ne`"
    class="cursor-ne-resize"
    :x="x + width"
    :y="y"
  />
  <DiagramViewFrameHandle
    :id="`${diagramId}|handle-e`"
    class="cursor-e-resize"
    :x="x + width"
    :y="y + height / 2"
  />
  <DiagramViewFrameHandle
    :id="`${diagramId}|bottom-se`"
    class="cursor-se-resize"
    :x="x + width"
    :y="y + height"
  />
  <DiagramViewFrameHandle
    :id="`${diagramId}|handle-s`"
    class="cursor-s-resize"
    :x="x + width / 2"
    :y="y + height"
  />
  <DiagramViewFrameHandle
    :id="`${diagramId}|handle-sw`"
    class="cursor-sw-resize"
    :x="x"
    :y="y + height"
  />
  <DiagramViewFrameHandle
    :id="`${diagramId}|handle-w`"
    class="cursor-w-resize"
    :x="x"
    :y="y + height / 2"
  />
</template>
