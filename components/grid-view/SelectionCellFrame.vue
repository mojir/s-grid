<script setup lang="ts">
import type { Grid } from '~/lib/grid/Grid'
import { Rectangle } from '~/lib/layout/Rectangle'
import type { RangeReference } from '~/lib/reference/RangeReference'
import { getAutoFillRangeInfo, type Heading } from '~/lib/reference/utils'

const props = defineProps<{
  grid: Grid
}>()

const { grid } = toRefs(props)

const selection = computed(() => grid.value.selection.selectedRange.value)

const rectangle = computed<Rectangle>(() => {
  return Rectangle.fromReference(grid.value.selection.selectedRange.value)
})

const autoFillRangeInfo = computed(() => {
  const state = grid.value.state.value
  const secondaryPosition = grid.value.secondaryPosition.value
  if (state !== 'rangeAutoFilling' || !secondaryPosition) {
    return null
  }
  return getAutoFillRangeInfo(selection.value, secondaryPosition)
})

const autoFillRange = computed<RangeReference | null>(() => {
  return autoFillRangeInfo.value?.autoFillRange ?? null
})

const autoFillDirection = computed<Heading | null>(() => {
  if (!autoFillRangeInfo.value) {
    return null
  }
  return autoFillRangeInfo.value.direction
})

const visible = computed(() => selection.value.size() !== 1 || !selection.value.start.equals(grid.value.position.value))
const active = computed(() => visible.value)

const x = computed(() => rectangle.value.x + 1)
const y = computed(() => rectangle.value.y + 1)
const width = computed(() => rectangle.value.width - 1)
const height = computed(() => rectangle.value.height - 1)
const handleGap = 7
</script>

<template>
  <template v-if="visible">
    <div
      class="overflow-hidden absolute bg-selected-cell p-2 pointer-events-none"
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
    <!-- top -->
    <FloaterLine
      :id="`selection|top-move`"
      width="thin"
      :x1="x - 1"
      :y1="y"
      :x2="x + width + 1"
      :y2="y"
      :class="{ 'cursor-grab': active, 'pointer-events-none': !active }"
    />
    <!-- bottom -->
    <FloaterLine
      :id="`selection|bottom-move`"
      width="thin"
      :x1="x - 1"
      :y1="y + height"
      :x2="x + width - (active ? handleGap : 0) + 1"
      :y2="y + height"
      :class="{ 'cursor-grab': active, 'pointer-events-none': !active }"
    />
    <!-- left -->
    <FloaterLine
      :id="`selection|left-move`"
      width="thin"
      :x1="x"
      :y1="y - 1"
      :x2="x"
      :y2="y + height"
      :class="{ 'cursor-grab': active, 'pointer-events-none': !active }"
    />
    <!-- right -->
    <FloaterLine
      :id="`selection|right-move`"
      width="thin"
      :x1="x + width"
      :y1="y - 1"
      :x2="x + width"
      :y2="y + height - (active ? handleGap : 0) + 1"
      :class="{ 'cursor-grab': active, 'pointer-events-none': !active }"
    />
    <FloaterHandle
      v-if="active"
      :id="`selection|handle-se`"
      :size="8"
      shape="plus"
      class="cursor-crosshair"
      :x="x + width"
      :y="y + height"
    />
    <GridRegion
      v-if="autoFillRange"
      class="border-dotted border-cell-border pointer-events-none"
      :class="{
        'border-t-0 border-r-2 border-b-2 border-l-2': autoFillDirection === 'down',
        'border-t-2 border-r-0 border-b-2 border-l-2': autoFillDirection === 'left',
        'border-t-2 border-r-2 border-b-0 border-l-2': autoFillDirection === 'up',
        'border-t-2 border-r-2 border-b-2 border-l-0': autoFillDirection === 'right',
      }"
      :region="autoFillRange"
    />
  </template>
</template>
