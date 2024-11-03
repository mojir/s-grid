<script setup lang="ts">
const colorMode = useColorMode()
console.log('colorMode', colorMode)
setColorMode(colorMode as unknown as Ref<string>)
</script>

<template>
  <main>
    <NuxtPage />
  </main>
</template>
