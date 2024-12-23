<script setup lang="ts">
import type { Grid } from '~/lib/grid/Grid'

const props = defineProps<{
  grid: Grid
  selected: boolean
  removable: boolean
}>()

const { selected, removable, grid } = toRefs(props)

const open = ref(false)
const removeDialogOpen = ref(false)
const renameDialogOpen = ref(false)
function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  if (!selected.value) {
    grid.value.project.selectGrid(grid.value)
  }
  else {
    open.value = true
  }
}
</script>

<template>
  <div
    class="flex pl-3 pr-1 hover:dark:bg-slate-700 hover:bg-gray-200 h-full items-center gap-1"
    :class="{
      'dark:bg-slate-700 bg-gray-200 font-bold cursor-default': selected,
      'dark:bg-slate-800 bg-gray-100 cursor-pointer': !selected,
    }"
    @click="grid.project.selectGrid(grid)"
    @contextmenu="onContextMenu"
  >
    <div class="whitespace-nowrap">
      <slot />
    </div>
    <DropdownMenu v-model:open="open">
      <DropdownMenuTrigger
        :style="{ visibility: selected ? 'visible' : 'hidden' }"
        class="flex cursor-pointer items-center hover:dark:bg-slate-800 hover:bg-gray-100 rounded-full"
      >
        <Icon
          name="mdi-menu-down"
          class="w-5 h-5"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          :disabled="!removable"
          @click="removeDialogOpen = !removeDialogOpen"
        >
          <Icon
            name="mdi-delete"
            class="w-5 h-5"
          />
          <span>Remove</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          @click="renameDialogOpen = !renameDialogOpen"
        >
          <Icon
            name="mdi-rename"
            class="w-5 h-5"
          />
          <span>Rename</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <DialogRemoveGrid
      v-model:open="removeDialogOpen"
      :grid="grid"
    />
    <DialogRenameGrid
      v-model:open="renameDialogOpen"
      :grid="grid"
    />
  </div>
</template>
