<script setup lang="ts">
defineProps<{
  gridName: string
}>()

const emit = defineEmits<{
  (e: 'remove'): void
}>()
</script>

<template>
  <Dialog>
    <DialogContent>
      <DialogTitle>
        Remove Grid
      </DialogTitle>
      <DialogDescription>
        Are you sure you want to remove the grid "{{ gridName }}"?
      </DialogDescription>
      <DialogFooter>
        <DialogClose>
          Cancel
        </DialogClose>
        <Button
          @click="emit('remove')"
        >
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
