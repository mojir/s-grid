<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLDivElement>()

// Token patterns for Lisp syntax
const PATTERNS = {
  STRING: /"(?:[^"\\]|\\.)*"/,
  NUMBER: /-?\d+(?:\.\d+)?/,
  COMMENT: /;.*/,
  KEYWORD: /\b(?:defun|let|if|cond|lambda|quote|car|cdr|cons|list)\b/,
  PAREN: /[()]/,
  SYMBOL: /[a-zA-Z_-]+/,
  WHITESPACE: /\s+/,
}

const tokenize = (code: string) => {
  const tokens = []
  let remaining = code

  while (remaining) {
    let match = null
    let type = null

    for (const [tokenType, pattern] of Object.entries(PATTERNS)) {
      const result = remaining.match(new RegExp(`^${pattern.source}`))
      if (result) {
        match = result[0]
        type = tokenType.toLowerCase()
        break
      }
    }

    if (!match) {
      // Handle unexpected characters
      tokens.push({
        type: 'text',
        value: remaining[0],
      })
      remaining = remaining.slice(1)
    }
    else {
      tokens.push({ type, value: match })
      remaining = remaining.slice(match.length)
    }
  }

  return tokens
}

const highlightCode = (code: string) => {
  const tokens = tokenize(code)
  let html = ''

  for (const token of tokens) {
    if (token.type === 'whitespace') {
      html += token.value
    }
    else {
      html += `<span class="token-${token.type}">${escapeHtml(token.value)}</span>`
    }
  }

  return html
}

const escapeHtml = (str: string) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const handleInput = (e: Event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target = e.target as any
  const plainText = target.textContent as string
  emit('update:modelValue', plainText)

  // Save cursor position
  const selection = window.getSelection()!
  const range = selection.getRangeAt(0)
  const offset = range.startOffset

  // Apply highlighting
  target.innerHTML = highlightCode(plainText)

  // Restore cursor position
  try {
    const newRange = document.createRange()
    let currentOffset = 0
    let targetNode = null

    // Find the text node where the cursor should be
    const walk = document.createTreeWalker(
      target,
      NodeFilter.SHOW_TEXT,
      null,
    )

    let node
    while ((node = walk.nextNode())) {
      const nodeLength = node.textContent!.length
      if (currentOffset + nodeLength >= offset) {
        targetNode = node
        break
      }
      currentOffset += nodeLength
    }

    if (targetNode) {
      newRange.setStart(targetNode, offset - currentOffset)
      newRange.setEnd(targetNode, offset - currentOffset)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
  }
  catch (err) {
    console.error('Error restoring cursor:', err)
  }
}

onMounted(() => {
  if (props.modelValue) {
    editorRef.value!.innerHTML = highlightCode(props.modelValue)
  }
})
</script>

<template>
  <div
    ref="editorRef"
    contenteditable="true"
    class="editor font-mono p-4 border rounded"
    @input="handleInput"
  />
</template>

<style scoped>
.editor {
  white-space: pre-wrap;
  min-height: 100px;
}

:deep(.token-string) {
  color: #a31515;
}

:deep(.token-number) {
  color: #098658;
}

:deep(.token-comment) {
  color: #008000;
  font-style: italic;
}

:deep(.token-keyword) {
  color: #0000ff;
}

:deep(.token-paren) {
  color: #800080;
}

:deep(.token-symbol) {
  color: #267f99;
}
</style>
