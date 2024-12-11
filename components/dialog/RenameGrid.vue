<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import type { Project } from '~/lib/project/Project'
import { getGridName } from '~/lib/utils'

const props = defineProps<{
  project: Project
  gridName: string
}>()

const open = defineModel('open', {
  type: Boolean,
  required: true,
})

const { gridName, project } = toRefs(props)

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required.' })
    .refine(newName => getGridName(newName) === getGridName(gridName.value) || !project.value.hasGrid(newName), {
      message: 'A grid with this name already exists.',
    })
    .default(gridName.value),
})

const { handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(formSchema),
})

const submitForm = handleSubmit(({ name }) => {
  console.log('submit', name)
  project.value.renameGrid(gridName.value, name)
  open.value = false
})

watch(open, (value) => {
  if (value) {
    resetForm()
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogTitle>
        Rename {{ gridName }}
      </DialogTitle>
      <DialogDescription>
        Please enter a new name for the grid "{{ gridName }}".
      </DialogDescription>
      <form
        @submit.prevent="submitForm"
        @keydown.stop
      >
        <FormField
          v-slot="{ componentField }"
          name="name"
        >
          <FormItem>
            <Label for="name">New grid name</Label>
            <FormControl>
              <Input
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
            Rename
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
