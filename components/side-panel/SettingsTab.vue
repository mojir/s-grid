<script setup lang="ts">
const { debugEnabled, darkMode, settings, timeZone } = useSettings()
</script>

<template>
  <div
    class="flex flex-col w-full text-sm dark:text-slate-400 text-gray-600 gap-2 pb-1"
  >
    <div class="flex items-center justify-between">
      <Label for="dark-mode-switch">Dark mode</Label>
      <Switch
        id="dark-mode-switch"
        :checked="darkMode"
        @update:checked="settings.darkMode = $event"
      />
    </div>
    <div class="flex items-center justify-between">
      <Label for="debug-mode-switch">Debug mode</Label>
      <Switch
        id="debug-mode-switch"
        :checked="debugEnabled"
        @update:checked="settings.debugEnabled = $event"
      />
    </div>
    <Label>Timezone</Label>
    <Select
      :model-value="timeZone"
      @update:model-value="settings.timeZone = $event === 'default' ? null : $event"
    >
      <SelectTrigger class="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent class="z-[1100]">
        <SelectGroup>
          <SelectItem :value="'default'">
            Auto detect time zone
          </SelectItem>
          <SelectSeparator />
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
  </div>
</template>
