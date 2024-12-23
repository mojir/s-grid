<script setup lang="ts">
import type { Grid } from '~/lib/grid/Grid'

const props = defineProps<{
  grid: Grid
}>()

const { grid } = toRefs(props)

function removeGrid() {
  grid.value.project.removeGrid(grid.value)
}
</script>

<template>
  <Dialog>
    <DialogContent>
      <DialogTitle>
        Remove Grid
      </DialogTitle>
      <DialogDescription>
        Are you sure you want to remove the grid "{{ grid.name.value }}"?
      </DialogDescription>
      <DialogFooter>
        <DialogClose>
          Cancel
        </DialogClose>
        <Button
          @click="removeGrid"
        >
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
