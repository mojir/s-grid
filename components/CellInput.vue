<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { Grid } from '~/lib/grid/Grid'

const props = defineProps<{
  grid: Grid
}>()

const { grid } = toRefs(props)

const initialValue = ref('')
const inputRef = ref<HTMLTextAreaElement>()
let autoCompleting: {
  originalText: string
  cursorPosition: number
  autoCompleter: AutoCompleter
  prefix: '=' | ':='
} | null = null

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
  if (selection.size() === 1 && selection.start.equals(grid.value.position.value)) {
    return
  }
  const inputElement = inputRef.value
  if (grid.value.editor.editingLitsCode.value && inputElement && grid.value.editor.editing.value) {
    const selectionValue = selection.size() === 1
      ? selection.start.toStringWithoutGrid()
      : selection.toStringWithoutGrid()

    const start = inputElement.selectionStart ?? 0
    const end = inputElement.selectionEnd ?? 0
    const value = inputElement.value
    inputElement.value
      = value.slice(0, start) + selectionValue + value.slice(end)
    const position = start + selectionValue.length
    inputElement.setSelectionRange(start, position)
    grid.value.editor.editorText.value = inputElement.value
    setTimeout(() => {
      inputElement.focus()
    })
  }
})

const selecting = computed(() => grid.value.state.value === 'selecting')
watch(selecting, (isSelecting) => {
  const inputElement = inputRef.value
  if (!isSelecting && inputElement) {
    const pos = inputElement.selectionEnd
    inputElement.setSelectionRange(pos, pos)
  }
})

function setEventFlags(e: KeyboardEvent) {
  const enableKeyboard = grid.value.editor.keyboardEnabled.value

  if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
    e.stopPropagation()
    e.preventDefault()
  }

  if (e.key === 'Tab' && isEditingLitsCode.value) {
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
      && e.key !== 'ArrowRight'
      && e.key !== 'ArrowLeft'
      && e.key !== 'PageUp'
      && e.key !== 'PageDown'
      && e.key !== 'Home'
      && e.key !== 'End'
    ) {
      e.stopPropagation()
    }
  }
  if (isEditingLitsCode.value && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.stopPropagation()
  }
}

function onKeyDown(e: KeyboardEvent) {
  setEventFlags(e)
  if (isEditingLitsCode.value) {
    grid.value.editor.keyboardEnabled.value = true
  }
  if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
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
  if (e.key === 'Tab' && isEditingLitsCode.value) {
    const inputElement = inputRef.value
    if (inputElement) {
      if (!autoCompleting) {
        const originalText = grid.value.editor.editorText.value
        const cursorPosition = inputRef.value?.selectionStart ?? 0
        const prefix = originalText.startsWith('=') ? '=' : ':='
        const autoCompleteProgram = originalText.slice(prefix.length, cursorPosition)
        autoCompleting = {
          autoCompleter: useLits().getAutoCompleter(autoCompleteProgram, Object.keys(grid.value.project.commandCenter.commands)),
          originalText,
          cursorPosition,
          prefix,
        }
      }
      const suggestion = e.shiftKey
        ? autoCompleting.autoCompleter.getPreviousSuggestion()
        : autoCompleting.autoCompleter.getNextSuggestion()

      if (!suggestion) {
        return
      }

      inputElement.value = autoCompleting.originalText.slice(0, autoCompleting.cursorPosition - suggestion.searchPattern.length) + suggestion.suggestion + autoCompleting.originalText.slice(autoCompleting.cursorPosition)
      grid.value.editor.editorText.value = inputElement.value
      const position = autoCompleting.cursorPosition - suggestion.searchPattern.length + suggestion.suggestion.length
      inputElement.setSelectionRange(position, position)
    }
  }
  else if (e.key === 'Escape') {
    if (autoCompleting) {
      const inputElement = inputRef.value
      if (inputElement) {
        inputElement.value = autoCompleting.originalText
        grid.value.editor.editorText.value = autoCompleting.originalText
        const position = autoCompleting.cursorPosition
        inputElement.setSelectionRange(position, position)
      }
      autoCompleting = null
      e.stopPropagation()
      e.preventDefault()
    }
  }
  else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Alt') {
    autoCompleting = null
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
  const width = Math.max(...widths) + 30 // Adding some padding

  inputRef.value!.style.width = `${width}px`
  const lineHeight = parseInt(computedStyle.lineHeight)
  const lines = grid.value.editor.editorText.value.split('\n').length
  inputRef.value!.style.height = `${lineHeight * lines + 5}px` // Adding some padding=
}
</script>

<template>
  <textarea
    ref="inputRef"
    v-model="grid.editor.editorText.value"
    class="border-2 border-blue-500 box-border min-h-full min-w-full resize-none relative px-1 dark:bg-slate-900 bg-white dark:text-white text-black font-mono"
    @input="updateDimensions"
    @keydown="onKeyDown"
    @click="grid.editor.keyboardEnabled.value = true"
  />
</template>
