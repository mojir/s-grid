<script setup lang="ts">
const { tabs, currentTab } = useSidePanel()
</script>

<template>
  <div
    class="px-2 flex flex-col text-slate-400 gap-4 h-full select-none"
  >
    <div
      class="flex box-border text-sm px-2 gap-4 items-end"
      :style="hs(50)"
    >
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="cursor-pointer border-b-2 hover:text-slate-200 transition-colors px-2 pb-1"
        :class="{
          'border-b-transparent text-slate-400': tab.id !== currentTab,
          'border-b-slate-400 text-slate-200': tab.id === currentTab,
        }"

        @click="currentTab = tab.id"
      >
        {{ tab.name }}
      </div>
    </div>
    <div class="px-2 select-text">
      <slot />
    </div>
  </div>
</template>
