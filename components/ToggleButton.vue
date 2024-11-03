<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  iconName: string
}>()

const { modelValue } = toRefs(props)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

watch(modelValue, (newModelValue) => {
  console.log('modelValue', newModelValue)
})

function onClick() {
  console.log('onClick', modelValue.value)
  if (modelValue.value) {
    emit('update:modelValue', false)
  }
  else {
    console.log('emit true')
    emit('update:modelValue', true)
  }
}
</script>

<template>
  <div
    class=" w-7 h-7 flex border dark:border-slate-700 border-gray-300 dark:text-gray-500 text-gray-400 hover:outline dark:outline-blue-800 outline-blue-300 items-center justify-center rounded-sm cursor-pointer"
    :class="{ 'dark:text-slate-300 text-gray-700 dark:border-slate-300 border-gray-800 ': modelValue }"
    @click="onClick"
  >
    <Icon :name="iconName" />
  </div>
</template>
