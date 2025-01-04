<script setup lang="ts">
import { Rectangle } from '~/lib/layout/Rectangle'
import type { Reference } from '~/lib/reference/utils'

const props = defineProps<{
  region: Ref<Reference>
  active?: boolean
}>()

const rectangle = computed<Rectangle>(() => {
  return Rectangle.fromReference(props.region.value)
})
</script>

<template>
  <div
    :style="{
      top: `${rectangle.y}px`,
      left: `${rectangle.x}px`,
      height: `${rectangle.height + 1}px`,
      width: `${rectangle.width + 1}px`,
    }"
    class="absolute overflow-visible"
    :class="{ 'pointer-events-none': !props.active }"
  >
    <slot />
  </div>
</template>
