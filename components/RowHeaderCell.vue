<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { whs } from '@/utils/cssUtils'
import type { Row } from '~/lib/Row'

const { grid, selection } = useGrid()

const props = defineProps<{
  row: Row
}>()

const { row } = toRefs(props)

const isSelected = computed(() => selection.value.containsRowIndex(row.value.index))
</script>

<template>
  <div

    :style="whs(grid.rowHeaderWidth, row.height)"
    class="flex flex-col border-r border-b border-slate-700 box-border"
    :class="{ 'bg-header-selection border-b-slate-600 border-r-slate-600': isSelected }"
  >
    <div
      :id="row.id"
      :style="whs(grid.rowHeaderWidth, row.height)"
      class="flex justify-center items-center text-xs select-none"
    >
      {{ row.id }}
    </div>
    <div
      :style="whs(grid.rowHeaderWidth, 5)"
      class="bg-transparent mt-[-3px] z-10 cursor-row-resize"
    />
  </div>
</template>
