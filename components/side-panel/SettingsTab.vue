<script setup lang="ts">
const { debugEnabled, darkMode, settings, localTimeZone } = useSettings()

const localTimeZoneLabel = computed(() => `Local time zone - ${localTimeZone.value.label}`)
const timeZoneLabel = computed<string>(() =>
  settings.value.timeZone
    ? allTimeZones.find(tz => tz.id === settings.value.timeZone)?.label ?? localTimeZoneLabel.value
    : localTimeZoneLabel.value,
)
</script>

<template>
  <div
    class="flex flex-col w-full text-sm dark:text-slate-400 text-gray-600 gap-2 pb-1"
  >
    <div class="flex items-center">
      <Label
        class="flex-1 cursor-pointer hover:underline"
        for="dark-mode-switch"
      >Dark mode</Label>
      <Switch
        id="dark-mode-switch"
        :checked="darkMode"
        @update:checked="settings.darkMode = $event"
      />
    </div>
    <div class="flex items-center">
      <Label
        class="flex-1 cursor-pointer hover:underline"
        for="debug-mode-switch"
      >Debug mode</Label>
      <Switch
        id="debug-mode-switch"
        :checked="debugEnabled"
        @update:checked="settings.debugEnabled = $event"
      />
    </div>
    <Label>Timezone</Label>
    <Select
      :model-value="settings.timeZone ?? 'default'"
      @update:model-value="settings.timeZone = $event === 'default' ? null : $event"
    >
      <SelectTrigger class="w-full">
        {{ timeZoneLabel }}
      </SelectTrigger>
      <SelectContent class="z-[1100]">
        <SelectGroup>
          <SelectItem :value="'default'">
            {{ localTimeZoneLabel }}
          </SelectItem>
          <SelectSeparator />
          <SelectItem

            v-for="zone in allTimeZones"
            :key="zone.id"
            :value="zone.id"
          >
            {{ zone.label }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
