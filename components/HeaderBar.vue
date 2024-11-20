<script setup lang="ts">
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)
</script>

<template>
  <Toolbar :grid-project="gridProject" />
</template>
