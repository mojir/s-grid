<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = project.value.currentGrid
const selection = grid.value.selection.selectedRange
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="project.clipboard.cut(selection)"
      >
        <Icon
          name="mdi-content-cut"
          class="w-4 h-4"
        />
        Cut
        <ContextMenuShortcut>
          <ShortcutDisplay
            meta
            char="X"
          />
        </ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="project.clipboard.copy(selection)"
      >
        <Icon
          name="mdi-content-copy"
          class="w-4 h-4"
        />
        Copy
        <ContextMenuShortcut>
          <ShortcutDisplay
            meta
            char="C"
          />
        </ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="project.clipboard.paste(selection)"
      >
        <Icon
          name="mdi-content-paste"
          class="w-4 h-4"
        />
        Paste
        <ContextMenuShortcut>
          <ShortcutDisplay
            meta
            char="V"
          />
        </ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
