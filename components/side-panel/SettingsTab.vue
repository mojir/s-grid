<script setup lang="ts">
const colorMode = useColorMode()

const darkModeOn = ref(colorMode.value === 'dark')
watch(darkModeOn, (value) => {
  colorMode.preference = value ? 'dark' : 'light'
})

const { debugEnabled, activeInfoLoggers } = useDebug()
</script>

<template>
  <div
    class="flex flex-col w-full text-sm dark:text-slate-400 text-gray-600 gap-2"
  >
    <label class="flex items-center cursor-pointer justify-between">
      <span>Dark mode</span>
      <input
        v-model="darkModeOn"
        type="checkbox"
        class="sr-only peer"
        checked
      >
      <div class="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white peer-checked:after:dark:border-gray-900 after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white dark:after:bg-gray-900 after:border-gray-300 after:dark:border-gray-800 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-slate-700 peer-checked:dark:bg-slate-500" />
    </label>
    <label class="flex items-center cursor-pointer justify-between">
      <span>Debug mode</span>
      <input
        v-model="debugEnabled"
        type="checkbox"
        class="sr-only peer"
        checked
      >
      <div class="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white peer-checked:after:dark:border-gray-900 after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white dark:after:bg-gray-900 after:border-gray-300 after:dark:border-gray-800 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-slate-700 peer-checked:dark:bg-slate-500" />
    </label>
    <div
      v-if="debugEnabled"
      class="mt-2"
    >
      <div class="font-bold text-base mb-2">
        Active info loggers
      </div>
      <div class="flex flex-col gap-1">
        <div
          v-for="infoLogger of Object.keys(activeInfoLoggers)"
          :key="infoLogger"
          class="flex items-center space-x-2"
        >
          <Checkbox
            :id="infoLogger"
            :checked="activeInfoLoggers[infoLogger as DebugComponent]"
            @update:checked="activeInfoLoggers[infoLogger as DebugComponent] = $event"
          />
          <label
            :for="infoLogger"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {{ infoLogger }}
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
