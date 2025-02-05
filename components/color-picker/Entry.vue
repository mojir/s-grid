<script setup lang="ts">
import type { Color } from '~/lib/color'

const { darkMode } = useSettings()

const props = defineProps<{
  color: Color
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'color', color: Color): void
}>()

const { color } = toRefs(props)

const displayColor = computed(() => darkMode.value
  ? color.value
  : color.value.toggleLightness(),
)
</script>

<template>
  <div
    :style="{ backgroundColor: displayColor.getStyleString() }"
    class="flex w-5 h-5 rounded-full justify-center items-center cursor-pointer"
    @click="emit('color', color)"
  >
    <Icon
      v-if="selected"
      name="mdi:check"
      class="w-4 h-4 text-black"
      :class="{ 'text-white': color.isDark() }"
    />
  </div>
</template>
