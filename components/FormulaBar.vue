<script setup lang="ts">
import { isLitsFunction } from '@mojir/lits'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const singleCell = computed(() => {
  return grid.value.selection.selectedRange.value.size() === 1
})

const reference = computed(() => {
  if (grid.value.editor.editing.value) {
    return grid.value.position.value
  }
  if (singleCell.value) {
    return grid.value.selection.selectedRange.value.start
  }
  return grid.value.selection.selectedRange.value
})

const selectionLabel = computed(() => reference.value.toStringWithoutGrid())

const rows = computed(() => {
  return grid.value.selection.selectedRange.value.rowCount()
})

const cols = computed(() => {
  return grid.value.selection.selectedRange.value.colCount()
})

const input = computed(() => {
  return grid.value.currentCell.value.input.value
})

const displayString = computed(() => {
  return grid.value.currentCell.value.display.value
})

const type = computed(() => {
  return grid.value.currentCell.value.derivedType.value
})

const output = computed(() => {
  if (singleCell.value) {
    if (type.value === 'function') {
      return 'λ'
    }
    return replaceInfinities(grid.value.currentCell.value.output.value)
  }
  const mx = grid.value.selection.selectedRange.value.getCellMatrix().map(cell => cell.output.value)
  if (rows.value === 1 || cols.value === 1) {
    return mx.flat()
  }
  return mx.rows()
})

const arity = computed(() => {
  if (!singleCell.value) {
    return null
  }
  const fn = grid.value.currentCell.value.output.value
  if (!isLitsFunction(fn)) {
    return null
  }
  return fn.arity
})

const paramCountMin = computed<number | null>(() => {
  return arity.value?.min ?? null
})

const paramCountMax = computed<number | null>(() => {
  return arity.value?.max ?? null
})

const isFormula = computed(() => {
  return !!grid.value.currentCell.value.formula.value
})

const cellReadonly = computed(() => {
  return grid.value.currentCell.value.readonly.value
})

const spillObject = computed(() => {
  return grid.value.currentCell.value.spillValue.value
})

const spillValue = computed(() => {
  if (!spillObject.value) {
    return null
  }
  return spillObject.value.source.internalOutput.value
})

const spillSource = computed(() => {
  return spillObject.value?.source.cellReference.value.toStringWithoutGrid() ?? null
})

const alias = computed(() => {
  return project.value.aliases.reverseAliases.value[reference.value.toStringWithGrid()] ?? null
})

function recalculate() {
  const temp = grid.value.currentCell.value.input.value
  grid.value.currentCell.value.input.value = ''
  nextTick(() => {
    grid.value.currentCell.value.input.value = temp
  })
}

function stringify(value: unknown, short: boolean) {
  const str = short ? JSON.stringify(value) : JSON.stringify(value, null, 2)
  return str.replaceAll('"∞"', '∞').replaceAll('"-∞"', '-∞')
}
</script>

<template>
  <div
    class="dark:bg-slate-900 bg-white border-t dark:border-slate-800 border-gray-300 items-center min-h-[40px] overflow-auto [scrollbar-width:none] [-ms-overflow-style:none]"
  >
    <div class="flex gap-4 overlow-x-auto items-center mt-[2px]">
      <div
        class="w-9 flex items-center pl-3 -mr-2"
      >
        <Icon
          v-if="isFormula"
          name="mdi-reload"
          class="w-6 h-6 cursor-pointer text-gray-500 dark:text-gray-500 hover:text-gray-700 hover:dark:text-gray-300"
          @click="recalculate()"
        />
        <Icon
          v-else
          sname="mdi-emoticon-kiss-outline"
          name="mdi-emoticon-kiss-outline"
          class="w-6 h-6 text-gray-500 dark:text-gray-500"
        />
      </div>
      <FormulaBarEntry
        title="Project"
        :value="grid.project.name.value"
      />
      <FormulaBarEntry
        title="Grid"
        :value="grid.name.value"
      />
      <FormulaBarEntry
        :title="singleCell ? 'Cell' : 'Selection'"
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
        v-if="singleCell && input"
        title="Input"
        :value="input"
      />
      <FormulaBarEntry
        v-if="singleCell && displayString"
        title="Display string"
        :value="displayString"
      />
      <FormulaBarEntry
        :title="singleCell ? 'Output' : 'Selection Output'"
        :value="stringify(output, false)"
        :short-value="stringify(output, true)"
      />
      <FormulaBarEntry
        v-if="singleCell"
        title="Type"
        :value="type"
      >
        <div
          v-if="type === 'function'"
          class="flex flex-col"
        >
          <div
            class="flex items-center text-xs select-none text-gray-500 dark:text-gray-500 underline-offset-2"
          >
            Type
          </div>
          <pre
            id="formula-entry-value"
            class="text-sm break-words font-mono"
          >{{ type }}</pre>

          <div
            v-if="paramCountMin !== null"
            class="flex flex-col"
          >
            <div
              class="flex items-center text-xs select-none text-gray-500 dark:text-gray-500 underline-offset-2"
            >
              Min parameters
            </div>
            <pre
              id="formula-entry-value"
              class="text-sm break-words font-mono"
            >{{ paramCountMin }}</pre>
          </div>
          <div
            v-if="paramCountMax !== null"
            class="flex flex-col"
          >
            <div
              class="flex items-center text-xs select-none text-gray-500 dark:text-gray-500 underline-offset-2"
            >
              Max parameters
            </div>
            <pre
              v-if="paramCountMax !== null"
              id="formula-entry-value"
              class="text-sm break-words font-mono"
            >{{ paramCountMax }}</pre>
          </div>
        </div>
      </FormulaBarEntry>
      <FormulaBarEntry
        v-if="cellReadonly && singleCell"
        title="Readonly"
        value="Yes"
      />
      <FormulaBarEntry
        v-if="spillValue !== null && singleCell"
        title="Spill value"
        :value="stringify(spillValue, false)"
        :short-value="stringify(spillValue, true)"
      />
      <FormulaBarEntry
        v-if="spillSource && singleCell"
        title="Spill source"
        :value="spillSource"
      />
      <FormulaBarEntry
        v-if="alias"
        title="Alias"
        :value="alias"
      />
    </div>
  </div>
</template>
