<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { whs } from '@/utils/cssUtils'
import type { Row } from '~/lib/Row'

const { grid } = useGrid()

const props = defineProps<{
  row: Row
}>()

const { row } = toRefs(props)

const isSelected = computed(() => grid.value.selection.value.containsRowIndex(row.value.index))
</script>

<template>
  <div

    :style="whs(grid.rowHeaderWidth, row.height)"
    class="flex flex-col border-r border-b dark:border-slate-700 border-gray-300 box-border"
    :class="{ 'dark:bg-darkSelection bg-lightSelection dark:border-b-slate-600 border-b-gray-400 dark:border-r-slate-600 border-r-gray-400': isSelected }"
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
