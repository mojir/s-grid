<script setup lang="ts">
const colorMode = useColorMode()

const darkModeOn = ref(colorMode.value === 'dark')
watch(darkModeOn, (value) => {
  colorMode.preference = value ? 'dark' : 'light'
})

const { debugEnabled } = useDebug()
const { timeZone, allTimeZones } = useTimeZone()
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
    <Label>Timezone</Label>
    <Select v-model="timeZone">
      <SelectTrigger class="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent class="z-[1100]">
        <SelectGroup>
          <SelectLabel class="-ml-6">
            Sans Serif
          </SelectLabel>

          <SelectItem
            v-for="zone in allTimeZones"
            :key="zone.value"
            :value="zone.value"
          >
            {{ zone.label }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
    {{ timeZone }}
    <Button @click="timeZone = 'America/New_York'">
      Change timezone
    </Button>
  </div>
</template>
