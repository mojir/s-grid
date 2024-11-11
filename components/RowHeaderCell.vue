<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { whs } from '~/lib/utils'
import type { Row } from '~/lib/Row'

const props = defineProps<{
  row: Row
}>()

const { rowHeaderWidth } = useRowsAndCols()
const { selection } = useSelection()

const { row } = toRefs(props)

const isSelected = computed(() => selection.value.containsRowIndex(row.value.index.value))

const cellStyle = computed(() => {
  const style: CSSProperties = {
    width: `${rowHeaderWidth}px`,
    height: `${row.value.height.value + 1}px`,
    marginTop: '-1px',
    backgroundColor: isSelected.value ? 'var(--selected-header-background-color)' : 'var(--header-background-color)',
    borderColor: 'var(--header-border-color)',
    borderStyle: 'solid',
    borderTopWidth: row.value.index.value !== 0 ? '1px' : '0px',
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
      :id="row.id.value"
      :style="whs(rowHeaderWidth, row.height.value)"
      class="flex justify-center items-center text-xs select-none"
    >
      {{ row.id.value }}
    </div>
    <div
      :id="`resize-row:${row.id}`"
      :style="whs(rowHeaderWidth, 5)"
      class="bg-transparent mt-[-3px] z-10 cursor-row-resize"
    />
  </div>
</template>
