<script setup lang="ts">
const { copySelection, cutSelection, pasteSelection } = useGridClipboard()
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem
        class="flex gap-2 cursor-pointer"
        @click="cutSelection"
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
        @click="copySelection"
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
        @click="pasteSelection"
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
