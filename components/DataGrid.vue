<script setup lang="ts">
import { ref, watch } from 'vue'
import GridCell from './GridCell.vue'
import { hs } from '~/lib/utils'
import type { GridProject } from '~/lib/GridProject'
import type { CellLocator } from '~/lib/locator/CellLocator'
import { getDocumentCellId } from '~/lib/locator/utils'

const props = defineProps<{
  gridProject: GridProject
}>()

const emit = defineEmits<{
  (e: 'cell-dblclick', cellLocator: CellLocator): void
}>()

const { gridProject } = toRefs(props)
const grid = computed(() => gridProject.value.currentGrid.value)

watch(grid.value.position, (position) => {
  const cellElement = document.getElementById(getDocumentCellId(position, grid.value.name.value))
  cellElement?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  })
})

const el = ref<HTMLDivElement>()

defineExpose({
  el,
})
</script>

<template>
  <div
    ref="el"
    class="pl-[1px] pt-[1px] overflow-auto"
  >
    <GridContextMenu :grid-project="gridProject">
      <div
        v-for="row of grid.rows.value"
        :key="row.index.value"
        :style="hs(row.height.value)"
        class="flex"
      >
        <div
          v-for="col of grid.cols.value"
          :key="col.index.value"
          class="dark:bg-blue-700 bg-blue-200"
        >
          <GridCell
            :row="row"
            :col="col"
            :grid-project="gridProject"
            @cell-dblclick="emit('cell-dblclick', $event)"
          />
        </div>
      </div>
    </GridContextMenu>
  </div>
</template>
