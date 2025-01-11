<script setup lang="ts">
import type { Diagram } from '~/lib/Diagram'

const props = defineProps<{
  diagram: Diagram | null
}>()

const emit = defineEmits<{
  (e: 'cancel' | 'remove'): void
}>()

const { diagram } = toRefs(props)
</script>

<template>
  <Dialog>
    <DialogContent>
      <DialogTitle>
        Remove Diagram
      </DialogTitle>
      <DialogDescription>
        Are you sure you want to remove the diagram "{{ diagram?.name.value }}"?
      </DialogDescription>
      <DialogFooter>
        <DialogClose @click="emit('cancel')">
          Cancel
        </DialogClose>
        <Button @click="emit('remove')">
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
