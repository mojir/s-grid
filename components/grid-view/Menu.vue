<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = project.value.currentGrid
const selection = grid.value.selection.selectedRange
const currentReference = computed(() => selection.value.size() === 1
  ? selection.value.start
  : selection.value,
)

const contextMenuRef = ref()

const menuOpen = ref(false)
const currentAlias = computed(() => {
  return project.value.aliases.reverseAliases.value[currentReference.value.toStringWithGrid()] ?? null
})

const aliasInput = ref('')

const aliasTaken = computed(() => {
  const reference = project.value.aliases.aliases.value[aliasInput.value]?.value
  return reference && !reference?.equals(currentReference.value)
})

watch(menuOpen, (isOpen) => {
  if (isOpen) {
    aliasInput.value = currentAlias.value ?? ''
  }
  setTimeout(() => project.value.keyboardClaimed.value = isOpen)
  if (!isOpen) {
    // Trigger escape key or outside click
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(escapeEvent)
  }
})

function saveAlias() {
  const alias = aliasInput.value.trim()
  if (aliasTaken.value) {
    return
  }
  if (currentAlias.value) {
    if (alias === '') {
      project.value.aliases.removeAlias(currentAlias.value)
      menuOpen.value = false
    }
    else {
      project.value.aliases.editAlias(currentAlias.value, { newAlias: alias, newReference: currentReference.value })
    }
  }
  else {
    project.value.aliases.addAlias(alias, currentReference.value)
  }
  menuOpen.value = false
}
</script>

<template>
  <ContextMenu
    ref="contextMenuRef"
    @update:open="menuOpen = $event"
  >
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
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Icon
            name="mdi-rename-outline"
            class="w-5 h-5 mr-2"
          />
          Alias
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <div class="flex flex-col">
            <input
              v-model="aliasInput"
              type="text"
              class="border border-gray-300 dark:border-slate-700 rounded-md p-2"
              @keydown.stop
            >
            <Button
              class="mt-2 bg-blue-500 text-white rounded-md p-2"
              :disabled="aliasTaken || (aliasInput.trim() === '' && !currentAlias) || aliasInput.trim() === currentAlias"
              @click="saveAlias"
            >
              {{ aliasInput.trim() === '' && currentAlias ? 'Remove Alias' : 'Save Alias' }}
            </Button>
            <div
              v-if="aliasTaken"
              class="text-red-500 text-sm mt-1 text-center"
            >
              Alias is already taken.
            </div>
          </div>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContent>
  </ContextMenu>
</template>
