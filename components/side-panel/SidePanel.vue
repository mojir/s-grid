<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)

const { sidePanelOpen, currentTab } = useSidePanel()
const repl = project.value.repl
const tabsRef = ref()

watch(sidePanelOpen, () => {
  if (sidePanelOpen.value && currentTab.value === 'repl') {
    scrollToBottom()
  }
})

watch(repl.history, () => {
  if (sidePanelOpen.value && currentTab.value === 'repl') {
    scrollToBottom()
  }
})

function scrollToBottom() {
  nextTick(() => {
    tabsRef.value?.scrollToBottom()
  })
}
</script>

<template>
  <div
    class="fixed top-0 bottom-0 right-0 w-[500px] flex-grow duration-300 box-border bg-grid border-l dark:border-slate-800 border-gray-300 transition-[right]  max-w-full"
    :style="{ 'z-index': 1000 }"
    :class="{
      'right-[-500px]': !sidePanelOpen,
      'sidepanel-shadow': sidePanelOpen,
    }"
  >
    <Icon
      v-if="sidePanelOpen"
      name="mdi:window-close"
      size="26"
      class="cursor-pointer absolute top-[12px] right-[12px] dark:text-gray-400 text-gray-500 hover:dark:text-slate-200 hover:text-black transition-colors"
      @click="sidePanelOpen = false"
    />
    <SidePanelTabs ref="tabsRef">
      <SidePanelReplTab
        v-if="currentTab === 'repl'"
        :project="project"
        @scroll-to-bottom="scrollToBottom"
      />
      <SidePanelSettingsTab v-if="currentTab === 'settings'" />
      <SidePanelAliasTab
        v-if="currentTab === 'alias'"
        :project="project"
      />
      <SidePanelDebugTab
        v-if="currentTab === 'debug'"
        :project="project"
      />
    </SidePanelTabs>
  </div>
</template>
