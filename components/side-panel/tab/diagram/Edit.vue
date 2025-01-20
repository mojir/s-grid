<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import type { Diagram } from '~/lib/Diagram'
import { isDiagramName } from '~/lib/Diagrams'
import type { Project } from '~/lib/project/Project'
import { getReferenceFromString, isReferenceString } from '~/lib/reference/utils'

const props = defineProps<{
  project: Project
  diagram: Diagram
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const diagramName = ref(props.diagram.name.value)
const { project, diagram } = toRefs(props)

const formSchema = z.object({
  diagramName: z
    .string()
    .min(1, { message: 'Diagram name is required.' })
    .refine(isDiagramName, {
      message: 'Not a valid diagram name.',
    })
    .refine(newName => newName === diagramName.value || !project.value.diagrams.getDiagram(newName), {
      message: 'A diagram with this name already exists.',
    })
    .default(diagramName.value),
  dataReference: z
    .string()
    .refine(value => !value || isReferenceString(value), {
      message: 'Not a valid reference.',
    })
    .default(diagram.value?.dataReference.value?.toStringWithGrid() ?? ''),
})

const { handleSubmit, values, isFieldDirty } = useForm({
  validationSchema: toTypedSchema(formSchema),
})

const dirty = computed(() => Object.keys(values).some(key => isFieldDirty(key as keyof typeof values)))

const submitForm = handleSubmit(({ diagramName: newDiagramName, dataReference: newDataReferenceString }) => {
  const dataReference = isReferenceString(newDataReferenceString)
    ? getReferenceFromString(project.value.currentGrid.value, newDataReferenceString)
    : null
  if (newDataReferenceString && !dataReference) {
    throw new Error(`Invalid reference: ${dataReference}`)
  }
  diagram.value.dataReference.value = dataReference
  if (newDiagramName !== diagramName.value) {
    project.value.diagrams.diagramUpdated(diagram.value)
  }
  emit('close')
})
</script>

<template>
  <div>
    <form>
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
    </form>
    <div class="flex justify-between mt-4">
      <Button
        @click="emit('close')"
      >
        {{ dirty ? 'Cancel' : 'Close' }}
      </Button>
      <Button
        v-if="dirty"
        @click="submitForm()"
      >
        Save
      </Button>
    </div>
  </div>
</template>
