<script setup lang="ts">
defineProps<{
  title: string
  value: string
  shortValue?: string
}>()
</script>

<template>
  <div class="flex flex-col">
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div class="flex items-center text-xxs select-none text-gray-500 dark:text-gray-500">
          {{ title }}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="min-w-[200px] max-w-[80dvw] overflow-y-auto max-h-[50dvh] p-2">
        <div class="flex items-center text-xxs select-none text-gray-500 dark:text-gray-500">
          {{ title }}
        </div>
        <pre class="text-xs break-words font-mono">{{ value }}</pre>
      </DropdownMenuContent>
    </DropdownMenu>
    <div class="flex-1 text-xs max-w-60 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
      {{ shortValue ?? value }}
    </div>
  </div>
</template>
