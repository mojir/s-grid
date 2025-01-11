<script setup lang="ts">
import type { Diagram } from '~/lib/Diagram'
import type { Project } from '~/lib/project/Project'
import { getDiagramId } from '~/lib/reference/utils'

const props = defineProps<{
  project: Project
  diagram: Diagram
}>()

const { diagram, project } = toRefs(props)

const diagramId = computed(() => getDiagramId(diagram.value))
const active = computed(() => project.value.diagrams.activeDiagram.value === diagram.value)
const x = computed(() => diagram.value.rectangle.value.x)
const y = computed(() => diagram.value.rectangle.value.y)
const width = computed(() => diagram.value.rectangle.value.width)
const height = computed(() => diagram.value.rectangle.value.height)

const values = computed(() => {
  return diagram.value.dataReference.value?.getCells().map(cell => cell.output.value) ?? []
})
</script>

<template>
  <div
    :id="`${diagramId}|handle-move`"
    class="overflow-hidden absolute border-gray-400 dark:border-slate-500 bg-grid text-primary-foreground p-2"
    :class="{
      border: !active,
    }"
    :style="{
      top: `${y}px`,
      left: `${x}px`,
      width: `${width}px`,
      height: `${height}px`,
    }"
  >
    <div
      v-if="diagram.title"
      class="font-bold text-lg"
    >
      {{ diagram.title }}
    </div>
    <div class="flex flex-wrap flex-row gap-4">
      <div
        v-for="(value, index) in values"
        :key="index"
        class="text-sm"
      >
        {{ value }}
      </div>
    </div>
  </div>
  <DiagramViewFrame
    v-if="active"
    v-model:rectangle="diagram.rectangle.value"
    :diagram-id="diagramId"
  />
</template>
