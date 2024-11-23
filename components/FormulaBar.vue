<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { GridProject } from '~/lib/GridProject'
import { hs } from '~/lib/utils'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)
const grid = gridProject.value.currentGrid

const { sidePanelOpen } = useSidePanel()

const forceBlur = ref(false)
const initialValue = ref('')
const inputRef = ref<HTMLInputElement>()

const selectionLabel = computed(() => {
  if (grid.value.editor.editorFocused.value) {
    return grid.value.editor.editingCellId.value.toString()
  }
  if (grid.value.selection.selectedRange.value.size() === 1) {
    return grid.value.selection.selectedRange.value.start.toString()
  }
  return grid.value.selection.selectedRange.value.toString()
})

const cellInput = computed(() => {
  return grid.value.getCurrentCell().input.value
})

watch(cellInput, (input) => {
  grid.value.editor.editorText.value = input
  initialValue.value = input
})

watch(sidePanelOpen, (open) => {
  if (open) {
    cancel()
  }
})

const isEditingLitsCode = computed(() => grid.value.editor.isEditingLitsCode.value)
watch(isEditingLitsCode, (editing) => {
  if (!editing) {
    grid.value.resetSelection()
  }
})

const selectedRange = computed(() => grid.value.selection.selectedRange.value)
watch(selectedRange, (selection) => {
  const inputElement = inputRef.value
  if (grid.value.editor.isEditingLitsCode.value && inputElement && grid.value.editor.editorFocused.value) {
    const selectionValue = `${selection.size() === 1
      ? selection.start.toString()
      : selection.toSorted().toString()} `

    const start = inputElement.selectionStart ?? 0
    const end = inputElement.selectionEnd ?? 0
    const value = inputElement.value
    inputElement.value
      = value.slice(0, start) + selectionValue + value.slice(end)
    const position = start + selectionValue.length
    inputElement.setSelectionRange(start, position)
    grid.value.editor.editorText.value = inputElement.value
    inputElement.focus()
  }
})

const selecting = computed(() => grid.value.selection.selecting.value)
watch(selecting, (isSelecting) => {
  const inputElement = inputRef.value
  if (!isSelecting && inputElement) {
    const pos = inputElement.selectionEnd
    inputElement.setSelectionRange(pos, pos)
  }
})

const position = computed(() => grid.value.position.value)
watch(position, (position) => {
  save()
  grid.value.editor.editorText.value = grid.value.getCurrentCell()?.input.value ?? ''
  initialValue.value = grid.value.editor.editorText.value
  grid.value.editor.setEditingCellId(position)
})

onMounted(() => {
  grid.value.editor.setEditingCellId(grid.value.position.value)
  grid.value.editor.editorText.value = grid.value.getCellFromLocator(grid.value.editor.editingCellId.value).input.value
  initialValue.value = grid.value.editor.editorText.value
})

function onFocus() {
  const inputElement = inputRef.value
  if (inputElement) {
    const length = inputElement.value.length
    if (!grid.value.selection.selecting.value) {
      inputElement.setSelectionRange(length, length)
    }
  }
  grid.value.editor.setEditorFocused(true)
}

function onBlur() {
  if (!forceBlur.value && (grid.value.editor.isEditingLitsCode.value || grid.value.position.value.isSameCell(grid.value.editor.editingCellId.value))) {
    inputRef.value?.focus()
  }
  else {
    inputRef.value?.setSelectionRange(0, 0)
    grid.value.editor.setEditorFocused(false)
    save()
  }
}

function cancel() {
  forceBlur.value = true
  grid.value.editor.editorText.value = initialValue.value
  inputRef.value?.blur()
  nextTick(() => {
    forceBlur.value = false
  })
}

function save() {
  const text = grid.value.editor.editorText.value.trim()
  if (initialValue.value !== text) {
    const cell = grid.value.getCellFromLocator(grid.value.editor.editingCellId.value)
    cell.input.value = text
    initialValue.value = text
  }
  inputRef.value?.blur()
  grid.value.editor.setEditorFocused(false)
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
    grid.value.editor.editorText.value = input
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
        v-model="grid.editor.editorText.value"
        class="w-full py-1 px-2 bg-transparent dark:text-slate-300 text-gray-700 text-sm border-none focus:outline-none selection:dark:bg-slate-700 selection:bg-gray-300"
        @blur="onBlur"
        @focus="onFocus"
        @keydown="onKeyDown"
      >
    </div>
  </div>
</template>
