<script setup lang="ts">
const { tabs, currentTab } = useSidePanel()

const tabContentRef = ref<HTMLDivElement>()
defineExpose({
  scrollToBottom: () => tabContentRef.value?.scrollTo({
    top: tabContentRef.value.scrollHeight,
    behavior: 'instant',
  }),
})
</script>

<template>
  <div
    class="px-2 pb-4 flex flex-col dark:text-slate-400 text-gray-600 gap-4 h-full select-none"
  >
    <div
      class="flex box-border text-sm px-2 gap-4 items-end"
      :style="hs(50)"
    >
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="cursor-pointer border-b-2 dark:text-gray-400 text-gray-500 hover:dark:text-slate-200 hover:text-black transition-colors px-2 pb-1"
        :class="{
          'border-b-transparent dark:text-slate-400 text-gray-600': tab.id !== currentTab,
          'dark:border-b-slate-400 border-b-gray-600 dark:text-slate-200 text-black': tab.id === currentTab,
        }"

        @click="currentTab = tab.id"
      >
        {{ tab.name }}
      </div>
    </div>
    <div
      ref="tabContentRef"
      class="px-2 select-text overflow-auto"
    >
      <slot />
    </div>
  </div>
</template>
