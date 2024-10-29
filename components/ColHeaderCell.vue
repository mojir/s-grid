<script setup lang="ts">
import { useGrid } from '@/composables/useGrid'
import { whs } from '@/utils/cssUtils'
import type { Col } from '~/lib/Col'

const { grid, selection } = useGrid()

const props = defineProps<{
  col: Col
}>()

const hover = ref(false)

const { col } = toRefs(props)

const isSelected = computed(() => selection.value.containsColIndex(col.value.index))
</script>

<template>
  <div

    :style="whs(col.width, grid.colHeaderHeight)"
    class="relative border-r border-b border-slate-700 box-border"
    :class="{ 'bg-header-selection border-r-slate-600 border-b-slate-600': isSelected }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div
      :id="col.id"
      :style="whs(col.width, grid.colHeaderHeight)"
      class="flex flex-1 justify-center text-xs items-center select-none"
    >
      {{ col.id }}
    </div>
    <div
      :style="whs(5, grid.colHeaderHeight)"
      class="absolute bg-transparent top-0 right-[-3px] z-10 cursor-col-resize"
    />
    <Icon
      v-if="hover"
      name="mdi:triangle-down"
      class="absolute z-10 top-[9px] right-[8px] cursor-pointer items-center justify-center text-gray-400"
      :style="whs(8, 8)"
      @click.stop
    />
  </div>
</template>
