<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)

const { sidePanelOpen } = useSidePanel()
</script>

<template>
  <div
    class="gap-2 py-1 px-2 w-full flex dark:bg-slate-800 bg-white dark:text-slate-300 text-gray-700 box-border rounded-md drop-shadow-md min-w-[320px] overflow-y-hidden"
  >
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <AppLogo
          class="w-[60px] h-[60px] -ml-2 -my-3 cursor-pointer"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @click="project.clear()">
          New
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <div class="flex overflow-x-auto flex-1 items-center gap-x-0.5 gap-y-1 [scrollbar-width:none] [-ms-overflow-style:none]">
      <ToolbarUndoButton :project="project" />
      <ToolbarRedoButton
        :project="project"
        class="mr-2"
      />
      <ToolbarPaintButton
        :project="project"
        class="mr-2"
      />
      <ToolbarFontFamilySelector
        :project="project"
      />
      <ToolbarFontSizeSelector
        :project="project"
        class="mr-2"
      />
      <ToolbarBoldButton :project="project" />
      <ToolbarItalicButton :project="project" />
      <ToolbarTextDecorationSwitch
        :project="project"
        class="mr-3"
      />
      <ToolbarJustifySwitch
        :project="project"
        class="mr-3"
      />
      <ToolbarAlignSwitch
        :project="project"
        class="mr-3"
      />
      <ToolbarTextColorPicker :project="project" />
      <ToolbarBackgroundColorPicker
        :project="project"
        class="mr-3"
      />
      <ToolbarFormatterPicker
        :project="project"
        class="mr-1"
      />
    </div>

    <div
      class="items-center dark:text-slate-400 text-gray-600 h-7 w-7 mt-1"
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
