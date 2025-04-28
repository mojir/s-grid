<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const singleCell = computed(() => {
  return grid.value.selection.selectedRange.value.size() === 1
})

const selectionLabel = computed(() => {
  if (grid.value.editor.editing.value) {
    return grid.value.position.value.toStringWithoutGrid()
  }
  if (singleCell.value) {
    return grid.value.selection.selectedRange.value.start.toStringWithoutGrid()
  }
  return grid.value.selection.selectedRange.value.toStringWithoutGrid()
})

const rows = computed(() => {
  return grid.value.selection.selectedRange.value.rowCount()
})

const cols = computed(() => {
  return grid.value.selection.selectedRange.value.colCount()
})

const input = computed(() => {
  return grid.value.currentCell.value.input.value
})

const output = computed(() => {
  if (singleCell.value) {
    return grid.value.currentCell.value.output.value
  }
  const mx = grid.value.selection.selectedRange.value.getCellMatrix().map(cell => cell.output.value)
  if (rows.value === 1 || cols.value === 1) {
    return mx.flat()
  }
  return mx.rows()
})

const internalOutput = computed(() => {
  return grid.value.currentCell.value.internalOutput.value
})

const isFormula = computed(() => {
  return !!grid.value.currentCell.value.formula.value
})

const type = computed(() => {
  return grid.value.currentCell.value.derivedType.value
})

const cellReadonly = computed(() => {
  return grid.value.currentCell.value.readonly.value
})

const spillValue = computed(() => {
  return grid.value.currentCell.value.spillValue.value !== null
})

function recalculate() {
  const temp = grid.value.currentCell.value.input.value
  grid.value.currentCell.value.input.value = ''
  nextTick(() => {
    grid.value.currentCell.value.input.value = temp
  })
}
</script>

<template>
  <div
    class="dark:bg-slate-900 bg-white border-t dark:border-slate-800 border-gray-300 items-center min-h-[40px] overflow-auto"
  >
    <div class="flex justify-between px-2 overlow-x-auto items-center mt-[2px]">
      <div
        class="flex gap-x-4"
      >
        <FormulaBarEntry
          title="Project"
          :value="grid.project.name.value"
        />
        <FormulaBarEntry
          title="Grid"
          :value="grid.name.value"
        />
        <FormulaBarEntry
          title="Selection"
          :value="selectionLabel"
        />
        <FormulaBarEntry
          v-if="!singleCell"
          title="Rows"
          :value="`${rows}`"
        />
        <FormulaBarEntry
          v-if="!singleCell"
          title="Cols"
          :value="`${cols}`"
        />
        <FormulaBarEntry
          v-if="singleCell"
          title="Input"
          :value="input"
        />
        <FormulaBarEntry
          v-if="output !== null"
          :title="singleCell ? 'Output' : 'Selection Output'"
          :value="JSON.stringify(output, null, 2)"
          :short-value="JSON.stringify(output)"
        />
        <FormulaBarEntry
          v-if="singleCell"
          title="Type"
          :value="type"
        />
        <FormulaBarEntry
          v-if="internalOutput && singleCell && spillValue"
          title="Internal Output"
          :value="JSON.stringify(internalOutput, null, 2)"
          :short-value="JSON.stringify(internalOutput)"
        />
        <FormulaBarEntry
          v-if="cellReadonly && singleCell"
          title="Readonly"
          value="Yes"
        />
        <FormulaBarEntry
          v-if="spillValue && singleCell"
          title="Spill Value"
          value="Yes"
        />
      </div>
      <Button
        v-if="isFormula"
        variant="link"
        class="text-sm text-gray-600 dark:text-gray-400 h-auto"
        @click="recalculate()"
      >
        Recalculate
      </Button>
    </div>
  </div>
</template>
