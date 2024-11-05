<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useGrid } from '@/composables/useGrid'
import { hs } from '~/lib/utils'

const { grid } = useGrid()
const { selection, selecting } = useSelection()
const {
  editingLitsCode,
  editorFocused,
  setEditorFocused,
  editorText, setEditingCellId, editingCellId } = useEditor()

const initialValue = ref('')
const inputRef = ref<HTMLInputElement>()

const selectionLabel = computed(() => {
  if (editorFocused.value) {
    return editingCellId.value.id
  }
  if (selection.value.size() === 1) {
    return selection.value.start.id
  }
  return selection.value.id
})

watch(selection, (selection) => {
  const inputElement = inputRef.value
  if (editingLitsCode.value && inputElement && editorFocused.value) {
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
    editorText.value = inputElement.value
    inputElement.focus()
  }
})

watch(selecting, (selecting) => {
  const inputElement = inputRef.value
  if (!selecting && inputElement) {
    const pos = inputElement.selectionEnd
    inputElement.setSelectionRange(pos, pos)
  }
})

watch(grid.value.position, (position) => {
  save()
  editorText.value = grid.value.getCurrentCell()?.input.value ?? ''
  initialValue.value = editorText.value
  setEditingCellId(position)
})

onMounted(() => {
  setEditingCellId(grid.value.position.value)
  editorText.value = grid.value.getCell(editingCellId.value).input.value
  initialValue.value = editorText.value
})

function onFocus() {
  const inputElement = inputRef.value
  if (inputElement) {
    const length = inputElement.value.length
    inputElement.setSelectionRange(length, length)
  }
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
  const text = editorText.value.trim()
  if (initialValue.value !== text) {
    const cell = grid.value.getCell(editingCellId.value)
    cell.input.value = text
    initialValue.value = text
  }
  inputRef.value?.blur()
  setEditorFocused(false)
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
        v-model="editorText"
        class="w-full py-1 px-2 bg-transparent dark:text-slate-300 text-gray-700 text-sm border-none focus:outline-none selection:dark:bg-slate-700 selection:bg-gray-300"
        @blur="onBlur"
        @focus="onFocus"
        @keydown="onKeyDown"
      >
    </div>
  </div>
</template>
