<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { hs } from '@/utils/cssUtils'

const { grid, activeCellId, selection } = useGrid()
const {
  editingLitsCode,
  editorFocused,
  setEditorFocused,
  editorText, setEditingCellId, editingCellId } = useEditor()

const initialValue = ref('')
const inputRef = ref<HTMLInputElement>()

watch(selection, () => {
  const inputElement = inputRef.value
  if (
    editingLitsCode.value
    && inputElement
    && selection.value !== editingCellId.value
  ) {
    const start = inputElement.selectionStart ?? 0
    const end = inputElement.selectionEnd ?? 0
    const value = inputElement.value
    inputElement.value
      = value.slice(0, start) + selection.value + value.slice(end)
    inputElement.setSelectionRange(start, start + selection.value.length)
    editorText.value = inputElement.value
    inputElement.focus()
  }
})

watch(activeCellId, () => {
  save()
  editorText.value = grid.value.getCell(activeCellId.value)?.input.value ?? ''
  initialValue.value = editorText.value
  setEditingCellId(activeCellId.value)
})

onMounted(() => {
  setEditingCellId(activeCellId.value)
  editorText.value = grid.value.getCell(editingCellId.value)?.input.value ?? ''
  initialValue.value = editorText.value
})

function onFocus() {
  setEditorFocused(true)
}

function onBlur() {
  if (!editingLitsCode.value) {
    inputRef.value?.setSelectionRange(0, 0)
    setEditorFocused(false)
    save()
  }
  else {
    inputRef.value?.focus()
  }
}

function save() {
  if (initialValue.value !== editorText.value) {
    const cell = grid.value.getOrCreateCell(editingCellId.value)
    cell.input.value = editorText.value
    initialValue.value = editorText.value
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
    editorText.value = initialValue.value
    inputRef.value?.blur()
  },
  update: (input: string) => {
    editorText.value = input
    initialValue.value = input
  },
})
</script>

<template>
  <div
    class="overflow-hiddent flex bg-slate-900 border-t border-slate-800 items-center"
    :style="hs(32)"
  >
    <div
      :style="hs(20)"
      class="overflow-hidden items-center flex flex-1"
    >
      <div
        :style="hs(20)"
        class="flex pl-2 border-r border-slate-600 text-sm pr-4 min-w-20"
      >
        {{ editorFocused ? editingCellId : selection }}
      </div>
      <div
        class="ml-4 select-none cursor-pointer"
        @click="inputRef?.focus()"
      >
        &lambda;
      </div>
      <input
        ref="inputRef"
        v-model="editorText"
        class="w-full py-1 px-2 bg-transparent text-slate-300 text-sm border-none focus:outline-none selection:bg-slate-700"
        @blur="onBlur"
        @focus="onFocus"
        @keydown="onKeyDown"
      >
    </div>
  </div>
</template>
