<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  iconName: string
}>()

const { modelValue } = toRefs(props)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function onClick() {
  emit('update:modelValue', !modelValue.value)
}
</script>

<template>
  <Button
    variant="outline"
    size="icon"
    :class="{ 'dark:border-slate-300 border-gray-800': modelValue }"
    @click="onClick"
  >
    <Icon
      :name="iconName"
      class="w-5 h-5"
    />
  </Button>
</template>
