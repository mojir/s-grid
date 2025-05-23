<script setup lang="ts">
defineProps<{
  title: string
  value: string
  shortValue?: string
}>()

function select() {
  if (window === undefined) {
    return
  }
  const element = document.getElementById('formula-entry-value') as HTMLSpanElement
  if (!element) {
    return
  }
  const range = document.createRange()
  range.selectNodeContents(element)
  const selection = window.getSelection()
  if (!selection) {
    return
  }
  selection.removeAllRanges()
  selection.addRange(range)
}
</script>

<template>
  <div class="flex flex-col">
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div class="flex items-center text-xs select-none text-gray-500 dark:text-gray-500 hover:underline underline-offset-2 text-nowrap pr-2">
          {{ title }}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="min-w-[200px] max-w-[80dvw] overflow-y-auto max-h-[50dvh] p-2">
        <slot>
          <div
            class="flex items-center text-xs select-none text-gray-500 dark:text-gray-500 underline-offset-2"
            :class="{ 'hover:underline cursor-pointer': !$slots.default }"
            @click="select"
          >
            {{ title }}
          </div>
          <pre
            id="formula-entry-value"
            class="text-sm break-words font-mono"
          >{{ value }}</pre>
        </slot>
      </DropdownMenuContent>
    </DropdownMenu>
    <div class="flex-1 text-sm max-w-60 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
      {{ shortValue ?? value }}
    </div>
  </div>
</template>
