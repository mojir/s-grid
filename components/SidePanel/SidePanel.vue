<script setup lang="ts">
const { sidePanelOpen, currentTab } = useSidePanel()
const { replFocused, history } = useREPL()
const contentRef = ref<HTMLDivElement>()

watch(sidePanelOpen, () => {
  replFocused.value = sidePanelOpen.value
  if (sidePanelOpen.value) {
    scrollToBottom()
  }
})

watch(history, () => {
  if (sidePanelOpen.value) {
    scrollToBottom()
  }
})

function scrollToBottom() {
  nextTick(() => {
    contentRef.value?.scrollTo({
      top: contentRef.value.scrollHeight,
      behavior: 'smooth',
    })
  })
}

function onSidePanelClick() {
  if (currentTab.value === 'repl') {
    replFocused.value = true
  }
}
</script>

<template>
  <div
    class="fixed top-0 bottom-0 right-0 flex-grow duration-300 box-border bg-slate-950 border-l border-slate-800 transition-all w-[600px] max-w-full"
    :class="{
      'right-[-600px]': !sidePanelOpen,
      'sidepanel-shadow': sidePanelOpen,
    }"

    @click="onSidePanelClick"
  >
    <Icon
      v-if="sidePanelOpen"
      name="mdi:window-close"
      size="26"
      class="cursor-pointer absolute top-[12px] right-[12px] text-slate-400 hover:text-slate-200 transition-colors"
      @click="sidePanelOpen = false"
    />
    <SidePanelTabs>
      <div
        ref="contentRef"
        class="flex overflow-auto pb-[50px]"
      >
        <SidePanelRepl
          v-if="currentTab === 'repl'"
          @scroll-to-bottom="scrollToBottom"
        />
      </div>
    </SidePanelTabs>
  </div>
</template>
