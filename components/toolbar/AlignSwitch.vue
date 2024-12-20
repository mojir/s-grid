<script setup lang="ts">
import type { WatchHandle } from 'vue'
import type { StyleAlign } from '~/dto/CellDTO'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const align = ref<StyleAlign>('auto')

let watchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  align.value = grid.value.getAlign(newSelection) ?? 'auto'

  const alignRefs = newSelection
    .getAllCellLocators()
    .map(locator => project.value.locator.getCellFromLocator(locator))
    .map(cell => cell.align)

  watchHandle?.stop()
  watchHandle = watch(alignRefs, () => {
    align.value = grid.value.getAlign(newSelection) || 'auto'
  })
}, { immediate: true })

function onUpdateTop(value: boolean) {
  align.value = value ? 'top' : 'auto'
  grid.value.setAlign(align.value, null)
}

function onUpdateMiddle(value: boolean) {
  align.value = value ? 'middle' : 'auto'
  grid.value.setAlign(align.value, null)
}

function onUpdateBottom(value: boolean) {
  align.value = value ? 'bottom' : 'auto'
  grid.value.setAlign(align.value, null)
}
</script>

<template>
  <div class="flex gap-1">
    <Toggle
      variant="outline"
      :pressed="align === 'top'"
      @update:pressed="onUpdateTop"
    >
      <Icon
        name="mdi:format-vertical-align-top"
        class="w-5 h-5"
      />
    </Toggle>
    <Toggle
      variant="outline"
      :pressed="align === 'middle'"
      @update:pressed="onUpdateMiddle"
    >
      <Icon
        name="mdi:format-vertical-align-center"
        class="w-5 h-5"
      />
    </Toggle>
    <Toggle
      variant="outline"
      :pressed="align === 'bottom'"
      @update:pressed="onUpdateBottom"
    >
      <Icon
        name="mdi:format-vertical-align-bottom"
        class="w-5 h-5"
      />
    </Toggle>
  </div>
</template>
