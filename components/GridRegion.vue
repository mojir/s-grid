<script setup lang="ts">
import type { Grid } from '~/lib/Grid'
import type { ReferenceLocator } from '~/lib/locator/Locator'
import type { RangeLocator } from '~/lib/locator/RangeLocator'

const props = defineProps<{
  grid: Grid
  region: Ref<ReferenceLocator>
  active?: boolean
}>()

const { grid } = toRefs(props)

const range = computed<RangeLocator>(() => {
  const range = props.region.value.toRangeLocator()
  return range
})
const top = computed(() => {
  const prevRows = grid.value.rows.value.slice(0, range.value.start.row)
  return prevRows.reduce((acc, row) => acc + row.height.value, 0)
})

const left = computed(() => {
  const prevCols = grid.value.cols.value.slice(0, range.value.start.col)
  return prevCols.reduce((acc, col) => acc + col.width.value, 0)
})

const height = computed(() => {
  const rows = grid.value.rows.value.slice(range.value.start.row, range.value.end.row + 1)
  return rows.reduce((acc, row) => acc + row.height.value, 0) + 1
})

const width = computed(() => {
  const cols = grid.value.cols.value.slice(range.value.start.col, range.value.end.col + 1)
  return cols.reduce((acc, col) => acc + col.width.value, 0) + 1
})
</script>

<template>
  <div
    :style="{ top: `${top}px`, left: `${left}px`, height: `${height}px`, width: `${width}px` }"
    class="absolute overflow-visible"
    :class="{ 'pointer-events-none': !props.active }"
  >
    <slot />
  </div>
</template>
