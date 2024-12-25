<script setup lang="ts">
import type { WatchHandle } from 'vue'
import { type StyleFontSize, styleFontSizes } from '~/dto/CellDTO'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const fontSize = ref<string | undefined>()

let watchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  const selectedFontSize = grid.value.getFontSize(newSelection)
  fontSize.value = selectedFontSize ? String(selectedFontSize) : undefined

  const fontSizeRefs = newSelection.getCells().map(cell => cell.fontSize)

  watchHandle?.stop()
  watchHandle = watch(fontSizeRefs, () => {
    const selectedFontSize = grid.value.getFontSize(newSelection)
    fontSize.value = selectedFontSize ? String(selectedFontSize) : undefined
  })
}, { immediate: true })

function onUpdateFontSize(value: string) {
  if (!value) {
    return
  }
  const numberValue = Number(value)
  fontSize.value = value
  grid.value.setFontSize(numberValue as StyleFontSize, null)
  grid.value.autoSetRowHeightByTarget()
}
</script>

<template>
  <div
    class="px-1 h-6 -mt-2  bg-transparent rounded-sm cursor-pointer text-sm"
  >
    <Select
      :model-value="fontSize"
      @update:model-value="onUpdateFontSize"
    >
      <SelectTrigger class="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Font size</SelectLabel>
          <SelectItem
            v-for="size of styleFontSizes"
            :key="size"
            :value="String(size)"
          >
            {{ size }}px
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
