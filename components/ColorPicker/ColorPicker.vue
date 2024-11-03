<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Color } from '~/lib/color'

defineProps<{
  title: string
  colorPalette: Color[][]
}>()

const emit = defineEmits<{
  (e: 'color', color: Color | null): void
}>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>{{ title }}</DropdownMenuLabel>
      <Button
        class="w-full"
        variant="secondary"
        size="sm"
        @click="emit('color', null)"
      >
        Remove Color
      </Button>
      <div class="flex flex-col gap-2 p-2">
        <div
          v-for="(colorRow, i) of colorPalette"
          :key="i"
          class="flex flex-row gap-2"
        >
          <ColorPickerEntry
            v-for="(color, j) of colorRow"
            :key="j"
            :color="color"
            @color="emit('color', $event)"
          />
        </div>
        <DropdownMenuSeparator />
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
