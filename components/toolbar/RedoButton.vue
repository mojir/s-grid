<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
</script>

<template>
  <Button
    variant="outline"
    size="icon"
    :disabled="!project.history.canRedo.value"
    @click="project.history.redo()"
  >
    <Icon
      name="mdi:redo"
      class="w-5 h-5"
    />
  </Button>
</template>
