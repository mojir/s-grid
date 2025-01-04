<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
  diagramName: string
}>()

const open = defineModel('open', {
  type: Boolean,
  required: true,
})

const { project, diagramName } = toRefs(props)

function removeDiagram() {
  project.value.diagrams.removeDiagram(diagramName.value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogTitle>
        Remove Diagram
      </DialogTitle>
      <DialogDescription>
        Are you sure you want to remove the diagram "{{ diagramName }}"?
      </DialogDescription>
      <DialogFooter>
        <DialogClose>
          Cancel
        </DialogClose>
        <Button
          @click="removeDiagram"
        >
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
