<script setup lang="ts">
import { toggleColorMode } from '@/lib/color'

const colors = ref([
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF',
  '#33FFA1', '#FF8C33', '#8C33FF', '#33FF8C', '#FF3333',
  '#33FF33', '#3333FF', '#FF33FF', '#33FFFF', '#FFFF33',
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF',
])

const complementColors = computed(() => {
  return colors.value.map(toggleColorMode)
})
</script>

<template>
  <div
    class="flex flex-col w-full text-sm dark:text-slate-400 text-gray-600 gap-2"
  >
    <div class="flex flex-row w-full gap-4 p-4">
      <div class="flex-1 flex flex-col gap-4">
        <div
          v-for="color of colors"
          :key="color"
          :style="{ backgroundColor: color }"
          class="flex-1 flex min-h-12 rounded-lg"
        />
      </div>
      <div class="flex-1 flex flex-col gap-4">
        <div
          v-for="color of complementColors"
          :key="color"
          :style="{ backgroundColor: color }"
          class="flex-1 flex h-12 rounded-lg"
        />
      </div>
    </div>
  </div>
</template>
