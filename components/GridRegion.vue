<script setup lang="ts">
import { Rectangle } from '~/lib/layout/Rectangle'
import type { Reference } from '~/lib/reference/utils'

const props = defineProps<{
  region: Reference
  active?: boolean
}>()

const { region, active } = toRefs(props)

const rectangle = computed<Rectangle>(() => {
  return Rectangle.fromReference(region.value)
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
    :class="{ 'pointer-events-none': !active }"
  >
    <slot />
  </div>
</template>
