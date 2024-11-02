<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { whs } from '@/utils/cssUtils'
import type { Row } from '~/lib/Row'

const { grid } = useGrid()

const props = defineProps<{
  row: Row
}>()

const { row } = toRefs(props)

const isSelected = computed(() => grid.value.selection.value.containsRowIndex(row.value.index))

const cellStyle = computed(() => {
  const style: CSSProperties = {
    width: `${grid.value.rowHeaderWidth}px`,
    height: `${row.value.height + 1}px`,
    marginTop: '-1px',
    backgroundColor: isSelected.value ? 'var(--selected-header-background-color)' : 'var(--header-background-color)',
    borderColor: 'var(--header-border-color)',
    borderStyle: 'solid',
    borderTopWidth: row.value.index !== 0 ? '1px' : '0px',
    borderBottomWidth: '1px',
    borderRightWidth: '1px',
  }
  return style
})
</script>

<template>
  <div
    :style="cellStyle"
    class="flex flex-col box-border"
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
