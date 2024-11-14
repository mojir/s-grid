<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { whs } from '~/lib/utils'
import { Col } from '~/lib/Col'

const props = defineProps<{
  col: Col
}>()

const { col } = toRefs(props)

const { selection, isColSelected, selectedCols } = useSelection()
const { colHeaderHeight } = useRowsAndCols()

const grid = useGrid()

function getAffectedCols() {
  const range = selectedCols.value
  if (!range || range.count === 1 || !isColSelected(col.value.id.value)) {
    return { start: col.value.id.value, end: col.value.id.value, count: 1 }
  }

  const start = Col.getColIdFromIndex(range.colIndex)
  const end = Col.getColIdFromIndex(range.colIndex + range.count - 1)
  return { start: start, end: end, count: range.count }
}

const deleteColLabel = computed(() => {
  const affextedCols = getAffectedCols()
  if (affextedCols.count === 1) {
    return 'Remove column'
  }

  const { start, end } = affextedCols
  return `Remove columns ${start} - ${end}`
})

function removeCol() {
  const { start, end } = getAffectedCols()
  grid.value.deleteCols(start, end)
}

const isSelected = computed(() => selection.value.containsColIndex(col.value.index.value))
const cellStyle = computed(() => {
  const style: CSSProperties = {
    height: `${colHeaderHeight}px`,
    width: `${col.value.width.value + 1}px`,
    minHeight: `${colHeaderHeight}px`,
    minWidth: `${col.value.width.value + 1}px`,
    marginLeft: '-1px',
    backgroundColor: isSelected.value ? 'var(--selected-header-background-color)' : 'var(--header-background-color)',
    borderColor: 'var(--header-border-color)',
    borderStyle: 'solid',
    borderLeftWidth: col.value.index.value !== 0 ? '1px' : '0px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
  }
  return style
})
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger
      :style="cellStyle"
      class="flex"
    >
      <div
        :id="col.id.value"
        :style="whs(col.width.value, colHeaderHeight)"
        class="flex flex-1 justify-center text-xs items-center select-none"
      >
        {{ col.id.value }}
      </div>
      <div
        :id="`resize-col:${col.id.value}`"
        :style="whs(5, colHeaderHeight)"
        class="bg-transparent ml-[-3px] z-10 cursor-col-resize"
      />
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="removeCol"
      >
        <Icon
          name="mdi-trash-can-outline"
          class="w-4 h-4"
        />
        {{ deleteColLabel }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
