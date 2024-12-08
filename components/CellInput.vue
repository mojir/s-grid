<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { Grid } from '~/lib/grid/Grid'

const props = defineProps<{
  grid: Grid
}>()

const { grid } = toRefs(props)

const initialValue = ref('')
const inputRef = ref<HTMLTextAreaElement>()

onMounted(() => {
  initialValue.value = grid.value.editor.editorText.value
  inputRef.value!.focus()
  updateDimensions()
})

const isEditingLitsCode = computed(() => grid.value.editor.editingLitsCode.value)
watch(isEditingLitsCode, (editing) => {
  if (!editing) {
    grid.value.resetSelection()
  }
})

const selectedRange = computed(() => grid.value.selection.selectedRange.value)
watch(selectedRange, (selection) => {
  const inputElement = inputRef.value
  if (grid.value.editor.editingLitsCode.value && inputElement && grid.value.editor.editing.value) {
    const selectionValue = `${selection.size() === 1
      ? selection.start.toStringWithoutGrid()
      : selection.toSorted().toStringWithoutGrid()} `

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

function setEventFlags(e: KeyboardEvent) {
  const enableKeyboard = grid.value.editor.keyboardEnabled.value

  if (e.key === 'Enter' && e.ctrlKey) {
    e.stopPropagation()
    e.preventDefault()
  }

  if (enableKeyboard) {
    if (e.key !== 'Escape' && e.key !== 'Enter' && e.key !== 'Tab') {
      e.stopPropagation()
    }
  }
  else {
    if (
      e.key !== 'Enter'
      && e.key !== 'Tab'
      && e.key !== 'Escape'
      && e.key !== 'ArrowUp'
      && e.key !== 'ArrowDown'
      && e.key !== 'ArrowLeft'
      && e.key !== 'ArrowRight'
      && e.key !== 'PageUp'
      && e.key !== 'PageDown'
      && e.key !== 'Home'
      && e.key !== 'End'
    ) {
      e.stopPropagation()
    }
  }
}

function onKeyDown(e: KeyboardEvent) {
  setEventFlags(e)
  if (e.key === 'Enter' && e.ctrlKey) {
    const inputElement = inputRef.value
    if (inputElement) {
      const start = inputElement.selectionStart ?? 0
      const end = inputElement.selectionEnd ?? 0
      const value = inputElement.value
      inputElement.value = value.slice(0, start) + '\n' + value.slice(end)
      const position = start + 1
      inputElement.setSelectionRange(position, position)
      grid.value.editor.editorText.value = inputElement.value
    }
  }
}

watch(grid.value.editor.editorText, () => {
  updateDimensions()
})

// Update width based on content
const updateDimensions = () => {
  const context = document.createElement('canvas').getContext('2d')
  if (!context || !inputRef.value) {
    return
  }
  const computedStyle = window.getComputedStyle(inputRef.value)
  context.font = `${computedStyle.fontWeight} ${computedStyle.fontStyle} ${computedStyle.fontSize} ${computedStyle.fontFamily}`
  const widths = grid.value.editor.editorText.value.split('\n').map(line => context.measureText(line).width)
  const width = Math.max(...widths)
  inputRef.value!.style.width = `${width + 15}px` // Adding some padding
  const lineHeight = parseInt(computedStyle.lineHeight)
  const lines = grid.value.editor.editorText.value.split('\n').length
  inputRef.value!.style.height = `${lineHeight * lines + 5}px` // Adding some padding
}
</script>

<template>
  <textarea
    ref="inputRef"
    v-model="grid.editor.editorText.value"
    class="border-2 border-blue-500 box-border min-h-full min-w-full resize-none relative px-1 dark:bg-slate-900 bg-white dark:text-white text-black"
    @input="updateDimensions"
    @keydown="onKeyDown"
    @click="grid.editor.keyboardEnabled.value = true"
  />
</template>
