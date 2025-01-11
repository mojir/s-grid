<script setup lang="ts">
import { Diagram } from '~/lib/Diagram'
import { Rectangle } from '~/lib/layout/Rectangle'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { sidePanelActive } = useSidePanel()
const { project } = toRefs(props)

const currentDiagram = project.value.diagrams.editingDiagram

function createDiagram() {
  const dataReference = project.value.currentGrid.value.selection.selectedRange.value.size() > 1
    ? project.value.currentGrid.value.selection.selectedRange.value
    : null

  const newDiagram = new Diagram({
    grid: project.value.currentGrid.value,
    name: project.value.diagrams.getNewDiagramName(),
    rectangle: Rectangle.fromPositionAndDimensions({
      position: {
        x: 100,
        y: 100,
      },
      dimensions: {
        width: 500,
        height: 300,
      },
    }),
  })
  if (dataReference) {
    newDiagram.dataReference.value = dataReference
  }
  project.value.diagrams.addDiagram(newDiagram)
  currentDiagram.value = newDiagram
}
</script>

<template>
  <div
    class="flex flex-col w-full text-sm text-primary-foreground gap-2"
  >
    <div>
      {{ sidePanelActive ? 'Active' : 'Inactive' }}
    </div>
    <SidePanelTabDiagramEdit
      v-if="currentDiagram"
      :project="project"
      :diagram="currentDiagram"
      @close="currentDiagram = null"
    />
    <SidePanelTabDiagramOverview
      v-else
      :project="project"
      @create-diagram="createDiagram()"
      @edit-diagram="currentDiagram = $event"
    />
  </div>
</template>
