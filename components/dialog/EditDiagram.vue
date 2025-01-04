<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Diagram } from '~/lib/Diagram'
import { isDiagramName } from '~/lib/Diagrams'
import type { Project } from '~/lib/project/Project'
import { isRangeReferenceString, RangeReference } from '~/lib/reference/RangeReference'
import { CellReference } from '~/lib/reference/CellReference'

const props = defineProps<{
  project: Project
  diagramName: string
  diagram: Diagram | null
}>()

const open = defineModel('open', {
  type: Boolean,
  required: true,
})

const { project, diagramName, diagram } = toRefs(props)

const formSchema = z.object({
  diagramName: z
    .string()
    .min(1, { message: 'Diagram name is required.' })
    .refine(isDiagramName, {
      message: 'Not a valid diagram name.',
    })
    .refine(newName => newName === diagramName.value || !project.value.diagrams.diagrams.value[newName], {
      message: 'A diagram with this name already exists.',
    })
    .default(diagramName.value),
  dataReference: z
    .string()
    .min(1, { message: 'Diagram data reference is required.' })
    .refine(isRangeReferenceString, {
      message: 'Not a valid reference.',
    })
    .default(diagram.value?.dataReference.value.toStringWithGrid() ?? ''),
})

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: toTypedSchema(formSchema),
})

const submitForm = handleSubmit(({ diagramName: newDiagramName, dataReference: newDataReference }) => {
  const dataReference = RangeReference.fromString(project.value.currentGrid.value, newDataReference)
  if (!dataReference) {
    throw new Error(`Invalid reference: ${dataReference}`)
  }
  // Edit
  if (diagram.value) {
    project.value.diagrams.updateDiagram(
      diagramName.value, {
        newName: newDiagramName,
        newDiagram: new Diagram({
          title: 'Example title',
          dataReference,
          anchor: CellReference.fromString(project.value.currentGrid.value, 'B2'),
          offsetX: 20,
          offsetY: 10,
        }),
      },
    )
  }
  // Add
  else {
    project.value.diagrams.addDiagram(newDiagramName, new Diagram({
      title: 'Example title',
      dataReference,
      anchor: CellReference.fromString(project.value.currentGrid.value, 'B2'),
      offsetX: 20,
      offsetY: 10,
    }))
  }
  open.value = false
})

watch(open, (value) => {
  if (value) {
    getCurrentRange()
    setFieldValue('dataReference', getCurrentRange())
    setFieldValue('diagramName', diagramName.value)
  }
})

function getCurrentRange() {
  if (diagram.value) {
    return diagram.value.dataReference.value.toStringWithGrid()
  }
  if (project.value.currentGrid.value.selection.selectedRange.value.size() > 1) {
    return project.value.currentGrid.value.selection.selectedRange.value.toStringWithoutGrid()
  }
  return ''
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogTitle>
        Edit Diagram
      </DialogTitle>
      <DialogDescription>
        Please enter a name and data reference for the diagram.
      </DialogDescription>
      <form
        @submit.prevent="submitForm"
        @keydown.stop
      >
        <FormField
          v-slot="{ componentField }"
          name="diagramName"
        >
          <FormItem>
            <Label for="diagramName">Diagram name</Label>
            <FormControl>
              <Input
                id="diagramName"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField
          v-slot="{ componentField }"
          name="dataReference"
        >
          <FormItem>
            <Label for="dataReference">Data Reference</Label>
            <FormControl>
              <Input
                id="dataReference"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter class="mt-4">
          <DialogClose as-child>
            <Button variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button
            @click="submitForm"
          >
            Save
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
