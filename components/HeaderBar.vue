<script setup lang="ts">
import { hs } from '@/utils/cssUtils'

const { sidePanelOpen } = useSidePanel()
</script>

<template>
  <div
    :style="hs(50)"
    class="flex items-center text-xl dark:bg-slate-800 bg-gray-200 dark:text-slate-300 text-gray-700 box-border"
  >
    <AppLogo />
  </div>
  <div
    class="absolute top-[12px] right-[12px] items-center dark:text-slate-400 text-gray-600"
    :style="whs(26, 26)"
  >
    <Icon
      v-if="!sidePanelOpen"
      name="mdi:menu-open"
      size="26"
      class="cursor-pointer dark:text-gray-400 text-gray-500 hover:dark:text-slate-200 hover:text-black  transition-colors"
      @click="sidePanelOpen = true"
    />
  </div>
</template>
