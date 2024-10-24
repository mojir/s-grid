<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

const rows = ref(
  Array.from({ length: 99 }, (_, i) => ({
    id: `${i + 1}`,
    height: 26,
  })),
)

const cols = ref(
  Array.from({ length: 26 * 3 }, (_, i) => ({
    id: getColHeader(i),
    width: 100,
  })),
)

function getColHeader(col: number) {
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode((col % 26) + 65) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}

const rowHeaderWidth = 50
const colHeaderHeight = 25
function dim(w: number | null, h: number | null) {
  const result: Record<string, string> = {}
  if (w !== null) {
    result.width = `${w}px`
    result.minWidth = `${w}px`
  }
  if (h !== null) {
    result.height = `${h}px`
    result.minHeight = `${h}px`
  }
  return result
}

const sheetRef = useTemplateRef('sheet')
const rowHeaderRef = useTemplateRef('rowHeader')
const colHeaderRef = useTemplateRef('colHeader')
let activeScrollElement: HTMLElement | null = null
let scrollTimer = 0

function syncScroll(event: Event) {
  // Avoid looping when another div trigger scroll event
  if (activeScrollElement && activeScrollElement !== event.target) {
    return
  }

  activeScrollElement = event.target as HTMLElement

  if (activeScrollElement === sheetRef.value) {
    rowHeaderRef.value!.scrollTop = activeScrollElement.scrollTop
    colHeaderRef.value!.scrollLeft = activeScrollElement.scrollLeft
  } else if (activeScrollElement === rowHeaderRef.value) {
    sheetRef.value!.scrollTop = activeScrollElement.scrollTop
  } else if (activeScrollElement === colHeaderRef.value) {
    sheetRef.value!.scrollLeft = activeScrollElement.scrollLeft
  }

  // Reset scrollingDiv after sync to allow future scroll events
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    activeScrollElement = null
  }, 20)
}
</script>

<template>
  <main class="flex flex-col h-screen bg-slate-900 text-slate-300">
    <div
      :style="dim(null, 50)"
      class="flex justify-center items-center text-2xl"
    >
      Litsheet
    </div>

    <div class="flex flex-grow flex-col overflow-hidden">
      <div
        class="flex"
        :style="dim(null, colHeaderHeight)"
      >
        <div
          class="flex bg-slate-800 box-border border-b border-r border-slate-700"
          :style="dim(rowHeaderWidth, colHeaderHeight)"
        ></div>
        <div
          class="flex overflow-y-auto bg-slate-800 no-scrollbar"
          ref="colHeader"
          @scroll="syncScroll"
        >
          <div
            v-for="col of cols"
            :key="col.id"
            :style="dim(col.width, colHeaderHeight)"
            class="flex"
          >
            <div :style="dim(3, null)" />
            <div
              class="flex flex-1 justify-center text-xs items-center select-none"
            >
              {{ col.id }}
            </div>
            <div
              :style="dim(5, null)"
              class="flex box-border border-x-2 border-slate-800 bg-slate-700 hover:cursor-col-resize mr-[-2px] z-10"
            />
          </div>
        </div>
      </div>
      <div class="flex overflow-hidden">
        <div
          ref="rowHeader"
          class="flex flex-col overflow-x-auto bg-slate-800 no-scrollbar"
          :style="dim(rowHeaderWidth, null)"
          @scroll="syncScroll"
        >
          <div
            v-for="row of rows"
            :key="row.id"
            :style="dim(rowHeaderWidth, row.height)"
            class="flex flex-col justify-center items-center text-xs"
          >
            <div
              :style="dim(null, 5)"
              class="flex w-full"
            />
            <div
              class="flex flex-1 overflow-hidden justify-center text-xs items-center select-none"
            >
              {{ row.id }}
            </div>
            <div
              :style="dim(null, 5)"
              class="flex w-full box-border border-y-2 border-slate-800 bg-slate-700 hover:cursor-row-resize mb-[-2px] z-10"
            />
          </div>
        </div>
        <div
          class="overflow-auto"
          ref="sheet"
          @scroll="syncScroll"
        >
          <div
            v-for="row of rows"
            :key="row.id"
            :style="dim(null, row.height)"
            class="flex"
          >
            <div
              v-for="col of cols"
              :key="col.id"
              :style="dim(col.width, row.height)"
              class="flex overflow-hidden box-border border-r border-b border-slate-800"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div
      :style="dim(null, 30)"
      class="bg-slate-800 box-border border-t border-slate-700"
    ></div>
  </main>
</template>
