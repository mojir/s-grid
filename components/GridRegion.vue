<script setup lang="ts">
import type { Grid } from '~/lib/grid/Grid'
import type { RangeReference } from '~/lib/reference/RangeReference'
import type { Reference } from '~/lib/reference/utils'

const props = defineProps<{
  grid: Grid
  region: Ref<Reference>
  active?: boolean
}>()

const { grid } = toRefs(props)

const range = computed<RangeReference>(() => {
  return props.region.value.toRangeReference()
})

const top = computed(() => {
  const prevRows = grid.value.rows.value.slice(0, range.value.start.rowIndex)
  return prevRows.reduce((acc, row) => acc + row.height.value, 0)
})

const left = computed(() => {
  const prevCols = grid.value.cols.value.slice(0, range.value.start.colIndex)
  return prevCols.reduce((acc, col) => acc + col.width.value, 0)
})

const height = computed(() => {
  const rows = grid.value.rows.value.slice(range.value.start.rowIndex, range.value.end.rowIndex + 1)
  return rows.reduce((acc, row) => acc + row.height.value, 0) + 1
})

const width = computed(() => {
  const cols = grid.value.cols.value.slice(range.value.start.colIndex, range.value.end.colIndex + 1)
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
