<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Color } from '~/lib/color'

const props = defineProps<{
  modelValue: Color | null
  colorPalette: Color[][]
  icon: string
}>()

const { modelValue } = toRefs(props)

const emit = defineEmits<{
  (e: 'update:modelValue', color: Color | null): void
}>()

const open = ref(false)

function updateColor(color: Color | null) {
  emit('update:modelValue', color)
  open.value = false
}
</script>

<template>
  <DropdownMenu
    :open="open"
    @update:open="open = false"
  >
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="icon"
        @click="open = !open"
      >
        <div class="flex flex-col">
          <Icon
            class="h-5 w-5"
            :name="icon"
          />
          <div
            class="w-full h-1 mt-[-3px]"
            :style="{ backgroundColor: modelValue?.getStyleString() ?? 'transparent' }"
          />
        </div>
      </Button>
      <slot />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <Button
        class="w-full"
        variant="secondary"
        size="sm"
        @click="updateColor(null)"
      >
        Remove Color
      </Button>
      <div class="flex flex-col gap-[4px] p-2">
        <div
          v-for="(colorRow, i) of colorPalette"
          :key="i"
          class="flex flex-row gap-[4px]"
        >
          <ColorPickerEntry
            v-for="(color, j) of colorRow"
            :key="j"
            :color="color"
            :selected="modelValue?.equals(color) ?? false"
            @color="updateColor"
          />
        </div>
        <DropdownMenuSeparator />
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
