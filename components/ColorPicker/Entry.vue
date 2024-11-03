<script setup lang="ts">
import type { Color } from '~/lib/color'

const colorMode = useColorMode()

const props = defineProps<{
  color: Color
}>()

const emit = defineEmits<{
  (e: 'color', color: Color): void
}>()

const { color } = toRefs(props)

const displayColor = computed(() => colorMode.value !== 'dark'
  ? color.value
  : color.value.toggleLightness(),
)
</script>

<template>
  <div
    :style="{ backgroundColor: displayColor.getStyleString() }"
    class="w-5 h-5 rounded-full"
    @click="emit('color', color)"
  />
</template>
