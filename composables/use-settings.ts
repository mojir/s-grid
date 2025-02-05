import { createSharedComposable } from '@vueuse/core'

export type Settings = {
  debugEnabled: boolean | null
  darkMode: boolean | null
  timeZone: string | null
}

// Create the record type
type Defaults = {
  [K in keyof Settings]: () => NonNullable<Settings[K]>
}

// Implement the record
const defaults: Defaults = {
  debugEnabled: () => false,
  darkMode: () => false,
  timeZone: () => getCurrentTimeZone(),
}

const localStorageKeys = 'sgrid-settings'

export default createSharedComposable(() => {
  const loadedSettings = loadSettings()

  const settings = ref<Settings>(loadedSettings)
  watch(settings, storeSettings, { immediate: true, deep: true })

  const debugEnabled = computed(() => settings.value.debugEnabled ?? defaults.debugEnabled())

  const darkMode = computed(() => settings.value.darkMode ?? defaults.darkMode())
  watch(darkMode, (value) => {
    // Use setTimeout to avoid nuxt dark mode to override the value
    setTimeout(() => {
      console.log('darkMode', value)
      useColorMode().preference = value ? 'dark' : 'light'
    }, 0)
  }, { immediate: true })

  const timeZone = computed(() => settings.value.timeZone ?? defaults.timeZone())

  return {
    settings,
    debugEnabled,
    darkMode,
    timeZone,
  }
})

function loadSettings(): Settings {
  const storedSettings = JSON.parse(localStorage.getItem(localStorageKeys) ?? '{}')
  const settings: Settings = {
    debugEnabled: null,
    darkMode: null,
    timeZone: null,
  }
  if (typeof storedSettings !== 'object' || storedSettings === null) {
    console.log('Invalid settings stored:', storedSettings)
    return settings
  }

  if (typeof storedSettings.debugEnabled === 'boolean') {
    settings.debugEnabled = storedSettings.debugEnabled
  }
  if (typeof storedSettings.darkMode === 'boolean') {
    settings.darkMode = storedSettings.darkMode
  }
  if (typeof storedSettings.timeZone === 'string' && allTimeZones.find(tz => tz.value === storedSettings.timeZone)) {
    settings.timeZone = storedSettings.timeZone
  }
  return settings
}

function storeSettings(settings: Settings) {
  localStorage.setItem(localStorageKeys, JSON.stringify(settings))
}
