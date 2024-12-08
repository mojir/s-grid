<script setup lang="ts">
const props = defineProps<{
  selected: boolean
  removable: boolean
}>()

const { selected, removable } = toRefs(props)

const emit = defineEmits<{
  (e: 'select' | 'remove'): void
}>()

const open = ref(false)
const dialogOpen = ref(false)
function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  if (!selected.value) {
    emit('select')
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
    @click="emit('select')"
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
          @click="dialogOpen = !dialogOpen"
        >
          Remove Grid
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <div class="p-4">
          <p class="text-lg">
            Are you sure you want to remove the grid?
          </p>
        </div>
        <DialogFooter>
          <Button
            @click="emit('remove')"
          >
            Remove
          </Button>
          <Button
            @click="dialogOpen = false"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
