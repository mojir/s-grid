<script setup lang="ts">
const props = defineProps<{
  meta?: boolean
  alt?: boolean
  shift?: boolean
  char: string
}>()

const { isMacOS } = useDevice()

const { meta, alt, shift } = toRefs(props)

const modifiers = computed(() => {
  const modifiers = []
  if (meta.value) modifiers.push(isMacOS ? '⌘' : 'Ctrl+')
  if (alt.value) modifiers.push(isMacOS ? '⌥' : 'Alt+')
  if (shift.value) modifiers.push(isMacOS ? '⇧' : 'Shift+')
  return modifiers.join('')
})
</script>

<template>
  <span>{{ modifiers }}{{ char }}</span>
</template>
