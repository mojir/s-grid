<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
  alias: string
}>()

const open = defineModel('open', {
  type: Boolean,
  required: true,
})

const { project, alias } = toRefs(props)

function removeAlias() {
  project.value.aliases.removeAlias(alias.value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogTitle>
        Remove Alias
      </DialogTitle>
      <DialogDescription>
        Are you sure you want to remove the alias "{{ alias }}"?
      </DialogDescription>
      <DialogFooter>
        <DialogClose>
          Cancel
        </DialogClose>
        <Button
          @click="removeAlias"
        >
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
