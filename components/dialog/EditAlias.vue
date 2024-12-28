<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { isAliasName } from '~/lib/Aliases'
import type { Project } from '~/lib/project/Project'
import { getReferenceFromString, isReferenceString } from '~/lib/reference/utils'

const props = defineProps<{
  project: Project
  alias: string
  reference: string
}>()

const open = defineModel('open', {
  type: Boolean,
  required: true,
})

const { project, alias, reference } = toRefs(props)

const formSchema = z.object({
  alias: z
    .string()
    .min(1, { message: 'Alias name is required.' })
    .refine(isAliasName, {
      message: 'Not a valid alias name.',
    })
    .refine(newName => newName === alias.value || !project.value.aliases.getReference(newName), {
      message: 'An alias with this name already exists.',
    })
    .default(alias.value),
  reference: z
    .string()
    .min(1, { message: 'Alias reference is required.' })
    .refine(isReferenceString, {
      message: 'Not a valid reference.',
    })
    .default(reference.value),
})

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: toTypedSchema(formSchema),
})

const submitForm = handleSubmit(({ alias: newAlias, reference: newReference }) => {
  const aliasReference = getReferenceFromString(project.value.currentGrid.value, newReference)
  if (!aliasReference) {
    throw new Error(`Invalid reference: ${newReference}`)
  }
  if (alias.value) {
    project.value.aliases.editAlias(alias.value, { newAlias, newReference: aliasReference })
  }
  else {
    project.value.aliases.setAlias(newAlias, aliasReference)
  }
  open.value = false
})

watch(open, (value) => {
  if (value) {
    setFieldValue('alias', alias.value)
    setFieldValue('reference', reference.value)
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogTitle>
        Edit Alias
      </DialogTitle>
      <DialogDescription>
        Please enter a name and reference for the alias.
      </DialogDescription>
      <form
        @submit.prevent="submitForm"
        @keydown.stop
      >
        <FormField
          v-slot="{ componentField }"
          name="alias"
        >
          <FormItem>
            <Label for="alias">Alias name</Label>
            <FormControl>
              <Input
                id="alias"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField
          v-slot="{ componentField }"
          name="reference"
        >
          <FormItem>
            <Label for="reference">Reference</Label>
            <FormControl>
              <Input
                id="reference"
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
