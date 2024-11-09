<script setup lang="ts">
const { sidePanelOpen } = useSidePanel()
</script>

<template>
  <div
    class="gap-2 py-1.5 px-4 w-full flex items-center dark:bg-slate-800 bg-white dark:text-slate-300 text-gray-700 box-border rounded-3xl drop-shadow-md"
  >
    <AppLogo
      class="w-[60px] h-[60px] -ml-2 -my-3"
    />

    <div class="flex flex-wrap flex-1 items-center gap-x-0.5 gap-y-1">
      <ToolbarFontSizeSelector class="mr-2" />
      <ToolbarBoldButton />
      <ToolbarItalicButton />
      <ToolbarTextDecorationSwitch class="mr-3" />
      <ToolbarJustifySwitch class="mr-3" />
      <ToolbarAlignSwitch class="mr-3" />
      <ToolbarTextColorPicker />
      <ToolbarBackgroundColorPicker class="mr-3" />
      <ToolbarNumberFormatterPicker class="mr-1" />
    </div>

    <div
      class="items-center dark:text-slate-400 text-gray-600 h-7 w-7"
    >
      <Icon
        v-if="!sidePanelOpen"
        name="mdi:menu-open"
        class="cursor-pointer dark:text-gray-400 text-gray-500 hover:dark:text-slate-200 hover:text-black  transition-colors h-7 w-7"
        @click="sidePanelOpen = true"
      />
    </div>
  </div>
</template>
