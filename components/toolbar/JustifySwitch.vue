<script setup lang="ts">
import type { StyleJustify } from '~/dto/CellStyleDTO'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const justify = ref<StyleJustify>()

watch(grid.value.selection.selectedRange, (newSelection) => {
  justify.value = grid.value.getStyle('justify', newSelection)
}, { immediate: true })

function onUpdateLeft(value: boolean) {
  justify.value = value ? 'left' : undefined
  grid.value.setStyle('justify', justify.value, null)
}

function onUpdateCenter(value: boolean) {
  justify.value = value ? 'center' : undefined
  grid.value.setStyle('justify', justify.value, null)
}

function onUpdateRight(value: boolean) {
  justify.value = value ? 'right' : undefined
  grid.value.setStyle('justify', justify.value, null)
}
</script>

<template>
  <div class="flex gap-1">
    <Toggle
      variant="outline"
      :pressed="justify === 'left'"
      @update:pressed="onUpdateLeft"
    >
      <Icon
        name="mdi:format-align-left"
        class="w-5 h-5"
      />
    </Toggle>
    <Toggle
      variant="outline"
      :pressed="justify === 'center'"
      @update:pressed="onUpdateCenter"
    >
      <Icon
        name="mdi:format-align-center"
        class="w-5 h-5"
      />
    </Toggle>
    <Toggle
      variant="outline"
      :pressed="justify === 'right'"
      @update:pressed="onUpdateRight"
    >
      <Icon
        name="mdi:format-align-right"
        class="w-5 h-5"
      />
    </Toggle>
  </div>
</template>
