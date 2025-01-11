<script setup lang="ts">
import type { Diagram } from '~/lib/Diagram'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  (e: 'createDiagram'): void
  (e: 'editDiagram', diagram: Diagram): void
}>()

const { project } = toRefs(props)
const diagramToRemove = shallowRef<Diagram | null>(null)

const diagrams = computed(() => {
  return project.value.diagrams.diagrams.value
})

function removeDiagram(diagram: Diagram | null) {
  if (!diagram) {
    return
  }
  project.value.diagrams.removeDiagram(diagram)
  diagramToRemove.value = null
}
</script>

<template>
  <div
    class="flex flex-col w-full text-sm text-primary-foreground gap-2"
  >
    <div>
      <div class="font-bold text-lg">
        Diagrams
      </div>
      <div>
        Diagrams are a way to visualize data in a grid. You can create a diagram by selecting a range of cells and clicking on the "Create Diagram" button.
      </div>
      <div>
        <Button
          class="mt-2"
          @click="emit('createDiagram')"
        >
          Create Diagram
        </Button>
      </div>
    </div>
    <div v-if="diagrams.length === 0">
      No Diagrams
    </div>
    <div
      v-else
    >
      <div class="flex gap-2 text-sm font-bold">
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          Diagram
        </div>
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          Reference
        </div>
        <div class="w-6/12 overflow-hidden truncate text-ellipsis">
          Nothing to see here
        </div>
      </div>
      <div
        v-for="diagram in diagrams"
        :key="diagram.name.value"
        class="flex gap-2 p-1 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
        @click="emit('editDiagram', diagram)"
      >
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          {{ diagram.name }}
        </div>
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          {{ diagram.dataReference.value?.toStringWithGrid() ?? '' }}
        </div>
        <div class="w-6/12 gap-4 flex overflow-hidden">
          <div class="w-9/12 overflow-hidden truncate text-ellipsis" />
          <div class="w-3/12 flex gap-2 justify-end items-center">
            <Button
              variant="link"
              class="p-0 m-0 h-auto"
              @click.stop="diagramToRemove = diagram"
            >
              <Icon
                name="mdi-trash"
                class="w-4 h-4 text-primary-muted-foreground hover:text-primary-foreground"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <DialogRemoveDiagram
    :open="!!diagramToRemove"
    :diagram="diagramToRemove"
    @cancel="diagramToRemove = null"
    @remove="removeDiagram(diagramToRemove)"
  />
  <!-- <DialogEditDiagram
    v-model:open="editDiagramDialogOpen"
    :project="project"
    :diagram-name="selectedDiagramName"
    :diagram="currentDiagram"
    @close="editDiagramDialogOpen = false"
  /> -->
</template>
