<script setup lang="ts">
import type { StyleJustify } from '~/dto/CellDTO'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const justify = ref<StyleJustify>('auto')

watch(grid.value.selection.selectedRange, (newSelection) => {
  justify.value = grid.value.getJustify(newSelection) ?? 'auto'
}, { immediate: true })

function onUpdateLeft(value: boolean) {
  justify.value = value ? 'left' : 'auto'
  grid.value.setJustify(justify.value, null)
}

function onUpdateCenter(value: boolean) {
  justify.value = value ? 'center' : 'auto'
  grid.value.setJustify(justify.value, null)
}

function onUpdateRight(value: boolean) {
  justify.value = value ? 'right' : 'auto'
  grid.value.setJustify(justify.value, null)
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
