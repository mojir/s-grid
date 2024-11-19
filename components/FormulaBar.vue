<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { hs } from '~/lib/utils'

const grid = useGrid()
const editor = useEditor()
const { sidePanelOpen } = useSidePanel()

const forceBlur = ref(false)
const initialValue = ref('')
const inputRef = ref<HTMLInputElement>()

const selectionLabel = computed(() => {
  if (editor.editorFocused.value) {
    return editor.editingCellId.value.id
  }
  if (grid.value.selection.selectedRange.value.size() === 1) {
    return grid.value.selection.selectedRange.value.start.id
  }
  return grid.value.selection.selectedRange.value.id
})

const cellInput = computed(() => {
  return grid.value.getCurrentCell().input.value
})

watch(cellInput, (input) => {
  editor.editorText.value = input
  initialValue.value = input
})

watch(sidePanelOpen, (open) => {
  if (open) {
    cancel()
  }
})

watch(editor.isEditingLitsCode, (editing) => {
  if (!editing) {
    grid.value.resetSelection()
  }
})

watch(grid.value.selection.selectedRange, (selection) => {
  const inputElement = inputRef.value
  if (editor.isEditingLitsCode.value && inputElement && editor.editorFocused.value) {
    const selectionValue = `${selection.size() === 1
      ? selection.start.id
      : selection.id} `

    const start = inputElement.selectionStart ?? 0
    const end = inputElement.selectionEnd ?? 0
    const value = inputElement.value
    inputElement.value
      = value.slice(0, start) + selectionValue + value.slice(end)
    const position = start + selectionValue.length
    inputElement.setSelectionRange(start, position)
    editor.editorText.value = inputElement.value
    inputElement.focus()
  }
})

watch(grid.value.selection.selecting, (isSelecting) => {
  const inputElement = inputRef.value
  if (!isSelecting && inputElement) {
    const pos = inputElement.selectionEnd
    inputElement.setSelectionRange(pos, pos)
  }
})

watch(grid.value.position, (position) => {
  save()
  editor.editorText.value = grid.value.getCurrentCell()?.input.value ?? ''
  initialValue.value = editor.editorText.value
  editor.setEditingCellId(position)
})

onMounted(() => {
  editor.setEditingCellId(grid.value.position.value)
  editor.editorText.value = grid.value.getCell(editor.editingCellId.value).input.value
  initialValue.value = editor.editorText.value
})

function onFocus() {
  const inputElement = inputRef.value
  if (inputElement) {
    const length = inputElement.value.length
    if (!grid.value.selection.selecting.value) {
      inputElement.setSelectionRange(length, length)
    }
  }
  editor.setEditorFocused(true)
}

function onBlur() {
  if (!forceBlur.value && (editor.isEditingLitsCode.value || grid.value.position.value.equals(editor.editingCellId.value))) {
    inputRef.value?.focus()
  }
  else {
    inputRef.value?.setSelectionRange(0, 0)
    editor.setEditorFocused(false)
    save()
  }
}

function cancel() {
  forceBlur.value = true
  editor.editorText.value = initialValue.value
  inputRef.value?.blur()
  nextTick(() => {
    forceBlur.value = false
  })
}

function save() {
  const text = editor.editorText.value.trim()
  if (initialValue.value !== text) {
    const cell = grid.value.getCell(editor.editingCellId.value)
    cell.input.value = text
    initialValue.value = text
  }
  inputRef.value?.blur()
  editor.setEditorFocused(false)
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
  cancel,
  update: (input: string) => {
    editor.editorText.value = input
    initialValue.value = input
  },
})
</script>

<template>
  <div
    class="overflow-hiddent flex dark:bg-slate-900 bg-white border-t dark:border-slate-800 border-gray-300 items-center"
    :style="hs(32)"
  >
    <div
      :style="hs(20)"
      class="overflow-hidden items-center flex flex-1"
    >
      <div
        :style="hs(20)"
        class="flex pl-2 border-r dark:border-slate-600 border-gray-400 text-sm pr-4 min-w-20"
      >
        {{ selectionLabel }}
      </div>
      <div
        class="ml-4 select-none cursor-pointer"
        @click="inputRef?.focus()"
      >
        &lambda;
      </div>
      <input
        ref="inputRef"
        v-model="editor.editorText.value"
        class="w-full py-1 px-2 bg-transparent dark:text-slate-300 text-gray-700 text-sm border-none focus:outline-none selection:dark:bg-slate-700 selection:bg-gray-300"
        @blur="onBlur"
        @focus="onFocus"
        @keydown="onKeyDown"
      >
    </div>
  </div>
</template>
