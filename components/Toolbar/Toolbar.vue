<script setup lang="ts">
import type { GridProject } from '~/lib/GridProject'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)

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
      <ToolbarPaintButton
        :grid-project="gridProject"
        class="mr-2"
      />
      <ToolbarFontSizeSelector
        :grid-project="gridProject"
        class="mr-2"
      />
      <ToolbarBoldButton :grid-project="gridProject" />
      <ToolbarItalicButton :grid-project="gridProject" />
      <ToolbarTextDecorationSwitch
        :grid-project="gridProject"
        class="mr-3"
      />
      <ToolbarJustifySwitch
        :grid-project="gridProject"
        class="mr-3"
      />
      <ToolbarAlignSwitch
        :grid-project="gridProject"
        class="mr-3"
      />
      <ToolbarTextColorPicker :grid-project="gridProject" />
      <ToolbarBackgroundColorPicker
        :grid-project="gridProject"
        class="mr-3"
      />
      <ToolbarNumberFormatterPicker
        :grid-project="gridProject"
        class="mr-1"
      />
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
