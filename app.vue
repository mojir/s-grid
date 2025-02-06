<script setup lang="ts">
const { timeZone, debugEnabled } = useSettings()

useLits().setupRefs({ timeZoneRef: timeZone, debugEnabledRef: debugEnabled })
useLogger().setupRefs({ debugEnabledRef: debugEnabled })
useSidePanel().setupRefs({ debugEnabledRef: debugEnabled })
</script>

<template>
  <main>
    <NuxtPage />
  </main>
</template>
