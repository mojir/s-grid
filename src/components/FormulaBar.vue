<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { h } from '@/utils/cssUtils'
import { onMounted, ref, watch } from 'vue'

const { grid, activeCellId, selection } = useGrid()
const emit = defineEmits<{
  (e: 'edit-lits', value: boolean): void
}>()

const initialValue = ref('')
const cellValue = ref('')
const inputRef = ref<HTMLInputElement>()
const focused = ref(false)
const editingLits = ref(false)

watch(selection, () => {
  const inputElement = inputRef.value
  if (
    editingLits.value &&
    inputElement &&
    selection.value !== activeCellId.value
  ) {
    const start = inputElement.selectionStart ?? 0
    const end = inputElement.selectionEnd ?? 0
    const value = inputElement.value
    inputElement.value =
      value.slice(0, start) + selection.value + value.slice(end)
    inputElement.setSelectionRange(start, start + selection.value.length)
    cellValue.value = inputElement.value
    inputElement.focus()
  }
})
watch(focused, () => {
  editingLits.value =
    !editingLits.value && focused.value && cellValue.value.startsWith('=')
})
watch(cellValue, () => {
  editingLits.value = focused.value && cellValue.value.startsWith('=')
})

watch(editingLits, () => {
  emit('edit-lits', editingLits.value)
})

watch(activeCellId, () => {
  cellValue.value = grid.value.getCell(activeCellId.value)?.input.value ?? ''
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
  if (!editingLits.value) {
    focused.value = false
    save()
  } else {
    inputRef.value?.focus()
  }
}

function save() {
  if (initialValue.value !== cellValue.value) {
    const cell = grid.value.getOrCreateActiveCell()
    cell.input.value = cellValue.value
    initialValue.value = cellValue.value
  }
  editingLits.value = false
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
    editingLits.value = false
    inputRef.value?.blur()
  },
  hasFocus: () => focused.value,
  update: (input: string) => {
    cellValue.value = input
    initialValue.value = input
  },
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
        :style="h(20)"
        class="flex pl-2 border-r border-slate-600 text-sm pr-4 min-w-20"
      >
        {{ focused ? activeCellId : selection }}
      </div>
      <div
        class="ml-4 select-none cursor-pointer"
        @click="inputRef?.focus()"
      >
        &lambda;
      </div>
      <input
        class="w-full py-1 px-2 bg-transparent text-slate-300 text-sm border-none focus:outline-none selection:bg-slate-700"
        v-model="cellValue"
        ref="inputRef"
        @blur="onBlur"
        @focus="onFocus"
        @keydown="onKeyDown"
      />
    </div>
  </div>
</template>
