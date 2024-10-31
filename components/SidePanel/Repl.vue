<script setup lang="ts">
const input = ref<string>('')
const enteredText = ref<string>('')
const {
  history,
  run,
  replFocused,
  getHistory,
  resetHistoryIndex,
  getSuggestion,
  clearSuggestions,
} = useREPL()
const { sidePanelHandleKeyDown } = useSidePanel()
const { exec } = useCommandCenter()

const emit = defineEmits<{
  (e: 'scroll-to-bottom'): void
}>()

const inputRef = ref<HTMLInputElement>()
watch(replFocused, () => {
  if (replFocused.value) {
    inputRef.value?.focus()
  }
  else {
    inputRef.value?.blur()
  }
})

watch(enteredText, () => {
  clearSuggestions()
})
function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  enteredText.value = value
  input.value = value
}

function runLits() {
  run(input.value)
  input.value = ''
}

function hasModifierKey(e: KeyboardEvent) {
  return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
}

function onKeyDown(e: KeyboardEvent) {
  sidePanelHandleKeyDown(e)

  if (e.key === 'Tab') {
    e.preventDefault()
    if (e.shiftKey) {
      input.value = getSuggestion(enteredText.value, 'previous')
    }
    else if (!hasModifierKey(e)) {
      input.value = getSuggestion(enteredText.value, 'next')
    }
  }

  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault()
    exec('ClearRepl!')
    enteredText.value = input.value = ''
    clearSuggestions()
    resetHistoryIndex()
  }

  if (hasModifierKey(e)) {
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    enteredText.value = input.value = ''
    clearSuggestions()
    resetHistoryIndex()
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    emit('scroll-to-bottom')
    enteredText.value = input.value = getHistory('previous')
  }
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    emit('scroll-to-bottom')
    enteredText.value = input.value = getHistory('next')
  }
  else if (e.key === 'PageDown') {
    e.preventDefault()
    emit('scroll-to-bottom')
    enteredText.value = input.value = getHistory('last')
  }
  else if (e.key === 'PageUp') {
    e.preventDefault()
    emit('scroll-to-bottom')
    enteredText.value = input.value = getHistory('first')
  }
}
</script>

<template>
  <div
    class="flex flex-col w-full text-xs dark:text-slate-400 text-gray-600 gap-2 font-mono"
  >
    <div
      class="flex flex-col gap-2"
      @click.stop
    >
      <div class="font-sans text-sm italic dark:text-slate-500 text-gray-500 mb-2">
        For help type <b>(Help)</b>
      </div>
      <div
        v-for="(entry, index) of history"
        :key="index"
        class="flex flex-col"
      >
        <div
          class="flex items-center"
          :style="hs(20)"
        >
          <Icon
            size="20"
            name="mdi-chevron-right"
          />
          <div class="dark:text-slate-200 text-gray-800">
            {{ entry.program }}
          </div>
        </div>
        <pre class="text-wrap">{{ entry.result }}</pre>
      </div>
    </div>
    <div
      class="flex items-center"
      :style="hs(20)"
    >
      <div
        class="flex items"
      >
        <Icon
          size="20"
          name="mdi-chevron-right"
        />
      </div>
      <input
        ref="inputRef"
        :value="input"
        class="font-mono w-full py-1 bg-transparent dark:text-slate-200 text-gray-800 placeholder:italic placeholder-gray-400 dark:placeholder-slate-600 text-xs border-none focus:outline-none selection:dark:bg-slate-700 selection:bg-gray-300"
        placeholder="Type your Lisp expression here"
        @input="onInput"
        @keydown.enter="runLits"
        @keydown.stop="onKeyDown"
        @fucus="replFocused = true"
        @blur="replFocused = false"
      >
    </div>
  </div>
</template>
