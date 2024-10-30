<script setup lang="ts">
import { hs } from '@/utils/cssUtils'

const { sidePanelOpen } = useSidePanel()
</script>

<template>
  <div
    :style="hs(50)"
    class="flex justify-center items-center text-2xl bg-slate-800 text-slate-300 box-border"
  >
    &lambda;itsheet
  </div>
  <div
    class="absolute top-[12px] right-[12px] items-center text-gray-400"
    :style="whs(26, 26)"
  >
    <Icon
      v-if="!sidePanelOpen"
      name="mdi:menu-open"
      size="26"
      class="cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
      @click="sidePanelOpen = true"
    />
  </div>
</template>
