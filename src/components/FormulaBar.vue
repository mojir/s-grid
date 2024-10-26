<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { cssUtils } from '@/utils'
import { onMounted, ref, toRefs, watch } from 'vue'

const props = defineProps<{
  activeCellId: string
}>()

const { activeCellId } = toRefs(props)

const { h, wh } = cssUtils
const { grid } = useGrid()

const initialValue = ref('')
const cellValue = ref('')
const inputRef = ref<HTMLInputElement>()
const focused = ref(false)

watch(activeCellId, newActiveCellId => {
  cellValue.value = grid.value.getCell(newActiveCellId)?.input.value ?? ''
  initialValue.value = cellValue.value
})

onMounted(() => {
  cellValue.value = grid.value.getCell(activeCellId.value)?.input.value ?? ''
  initialValue.value = cellValue.value
})

function onFocus() {
  focused.value = true
}

function onBlur() {
  focused.value = false
  save()
}

function save() {
  if (initialValue.value !== cellValue.value) {
    const cell = grid.value.getOrCreateCell(props.activeCellId)
    cell.input.value = cellValue.value
    initialValue.value = cellValue.value
  }
  inputRef.value?.blur()
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.stopPropagation()
  }
}

defineExpose({
  focus: () => {
    inputRef.value?.focus()
  },
  save,
  cancel: () => {
    cellValue.value = initialValue.value
    inputRef.value?.blur()
  },
  hasFocus: () => focused.value,
})
</script>

<template>
  <div
    class="overflow-hiddent flex bg-slate-900 border-t border-slate-800 items-center"
    :style="h(32)"
  >
    <div
      :style="h(20)"
      class="overflow-hidden items-center flex flex-1"
    >
      <div
        :style="wh(grid.rowHeaderWidth, 20)"
        class="flex pl-2 border-r border-slate-600 text-sm"
      >
        {{ activeCellId }}
      </div>
      <div
        class="ml-4 select-none cursor-pointer"
        @click="inputRef?.focus()"
      >
        &lambda;
      </div>
      <input
        class="w-full py-1 px-2 bg-transparent text-slate-300 text-sm border-none focus:outline-none"
        v-model="cellValue"
        ref="inputRef"
        @blur="onBlur"
        @focus="onFocus"
        @keydown="onKeyDown"
      />
    </div>
  </div>
</template>
