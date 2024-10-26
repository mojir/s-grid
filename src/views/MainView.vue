<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { ref, useTemplateRef, watch } from 'vue'
import { cssUtils } from '@/utils'
import DataSheet from '@/components/DataSheet.vue'

const { h } = cssUtils
const { grid } = useGrid()

const activeCellId = ref<string>('')

function setValue() {
  const cell = grid.value.getOrCreateCell(activeCellId.value)
  cell.input.value = cellValue.value
}

function applyFormatter() {
  const cell = grid.value.getOrCreateCell(activeCellId.value)
  cell.numberFormatter.value = numberFormatter.value
}

const valueInputRef = useTemplateRef('valueInput')

watch(activeCellId, newVal => {
  console.log('activeCellId', newVal)
  cellValue.value = grid.value.getCell(newVal)?.input.value ?? ''
  valueInputRef.value?.focus()
})

const cellValue = ref('')
const numberFormatter = ref('#(* 2 %)')
</script>

<template>
  <div class="flex flex-col py-2 ml-4 gap-2">
    <div class="flex gap-2 items-center">
      <div class="flex gap-1 items-center">
        CellId:<input
          class="border py-1 px-2"
          v-model="activeCellId"
        />
      </div>
    </div>

    <div class="flex gap-2 items-center">
      <div class="flex gap-1 items-center">
        Value:<input
          class="border py-1 px-2"
          v-model="cellValue"
          ref="valueInput"
          @blur="setValue"
        />
      </div>
      <button
        @click="setValue"
        class="underline"
      >
        Set value
      </button>
    </div>

    <div class="flex gap-2 items-center">
      <div class="flex gap-1 items-center">
        Formatter:<input
          class="border py-1 px-2"
          v-model="numberFormatter"
        />
      </div>
      <button
        @click="applyFormatter"
        class="underline"
      >
        Apply formatter
      </button>
    </div>
  </div>
  <main class="flex flex-col h-screen bg-slate-900 text-slate-300">
    <div
      :style="h(50)"
      class="flex justify-center items-center text-2xl"
    >
      &lambda;itsheet
    </div>

    <DataSheet v-model:active-cell-id="activeCellId" />

    <div
      :style="h(30)"
      class="bg-slate-800 box-border border-t border-slate-700"
    ></div>
  </main>
</template>
