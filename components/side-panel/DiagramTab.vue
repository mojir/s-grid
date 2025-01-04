<script setup lang="ts">
import type { Diagram } from '~/lib/Diagram'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const removeDiagramDialogOpen = ref(false)
const editDiagramDialogOpen = ref(false)
const currentDiagramName = ref('')
const currentDiagram = shallowRef<Diagram | null>(null)

const diagrams = computed(() => {
  return Object.entries(project.value.diagrams.diagrams.value)
    .map(([name, diagram]) => ({ name, dataReference: diagram.dataReference }))
})

function addDiagram() {
  currentDiagramName.value = ''
  currentDiagram.value = null
  editDiagramDialogOpen.value = true
}
function editDiagram(diagramName: string) {
  if (!project.value.diagrams.diagrams.value[diagramName]) {
    throw new Error(`Diagram "${diagramName}" does not exist.`)
  }
  currentDiagramName.value = diagramName
  currentDiagram.value = project.value.diagrams.diagrams.value[diagramName]
  editDiagramDialogOpen.value = true
}
function removeDiagram(diagramName: string) {
  currentDiagramName.value = diagramName
  removeDiagramDialogOpen.value = true
}
function printDiagram(diagramName: string) {
  const diagram = project.value.diagrams.diagrams.value[diagramName]
  console.log(diagram)
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
          @click="addDiagram()"
        >
          Add Diagram
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
        :key="diagram.name"
        class="flex gap-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          {{ diagram.name }}
        </div>
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          {{ diagram.dataReference.value.toStringWithGrid() }}
        </div>
        <div class="w-6/12 gap-4 flex overflow-hidden">
          <div class="w-9/12 overflow-hidden truncate text-ellipsis" />
          <div class="w-3/12 flex gap-2 justify-end items-center">
            <Button
              variant="link"
              class="p-0 m-0 h-auto"
              @click="printDiagram(diagram.name)"
            >
              <Icon
                name="mdi-eye"
                class="w-4 h-4 text-primary-foreground"
              />
            </Button>
            <Button
              variant="link"
              class="p-0 m-0 h-auto"
              @click="editDiagram(diagram.name)"
            >
              <Icon
                name="mdi-pencil"
                class="w-4 h-4 text-primary-foreground"
              />
            </Button>
            <Button
              variant="link"
              class="p-0 m-0 h-auto"
              @click="removeDiagram(diagram.name)"
            >
              <Icon
                name="mdi-trash"
                class="w-4 h-4 text-primary-foreground"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <DialogRemoveDiagram
    v-model:open="removeDiagramDialogOpen"
    :project="project"
    :diagram-name="currentDiagramName"
  />
  <DialogEditDiagram
    v-model:open="editDiagramDialogOpen"
    :project="project"
    :diagram-name="currentDiagramName"
    :diagram="currentDiagram"
    @close="editDiagramDialogOpen = false"
  />
</template>
