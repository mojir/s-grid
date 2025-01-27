<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import type { Grid } from '~/lib/grid/Grid'

const props = defineProps<{
  grid: Grid
}>()

const open = defineModel('open', {
  type: Boolean,
  required: true,
})

const { grid } = toRefs(props)

const currentGridName = computed(() => grid.value.name.value)

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required.' })
    .refine(newName => getGridName(newName) === getGridName(currentGridName.value) || !grid.value.project.hasGrid(newName), {
      message: 'A grid with this name already exists.',
    })
    .default(currentGridName.value),
})

const { handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(formSchema),
})

const submitForm = handleSubmit(({ name }) => {
  grid.value.project.renameGrid(grid.value, name)
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
        Rename {{ currentGridName }}
      </DialogTitle>
      <DialogDescription>
        Please enter a new name for the grid "{{ currentGridName }}".
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
