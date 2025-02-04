<script setup lang="ts">
import type { WatchHandle } from 'vue'
import { defaultFormatter } from '~/lib/constants'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const open = ref(false)

const currentFormatter = computed(() => grid.value.getFormatter(grid.value.selection.selectedRange.value) ?? defaultFormatter)
watch(open, (isOpen) => {
  if (isOpen) {
    format.value = currentFormatter.value
  }
  setTimeout(() => project.value.keyboardClaimed.value = isOpen)
})

const format = ref<string>(defaultFormatter)
const floatFormatter = '#(d3:format ".4~f" %)'
const fixed2Formatter = '#(d3:format ".2f" %)'
const integerFormatter = '#(d3:format "d" %)'
const percentFormatter = '#(str (d3:format ".2f" (* % 100)) "%")'
const sekFormatter = '#(str (d3:format ".2f" %) " kr")'
const usdFormatter = '#(str "$" (d3:format ".2f" %))'

const float = computed(() => format.value === floatFormatter)
const fixed2 = computed(() => format.value === fixed2Formatter)
const integer = computed(() => format.value === integerFormatter)
const percent = computed(() => format.value === percentFormatter)
const sek = computed(() => format.value === sekFormatter)
const usd = computed(() => format.value === usdFormatter)

let watchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  format.value = grid.value.getFormatter(newSelection) ?? ''

  const formatterRefs = newSelection.getCells().map(cell => cell.formatter)

  watchHandle?.stop()
  watchHandle = watch(formatterRefs, () => {
    format.value = grid.value.getFormatter(newSelection) || ''
  })
}, { immediate: true })

function setFloat() {
  format.value = floatFormatter
  grid.value.setFormatter(floatFormatter, null)
}

function setFixed2() {
  format.value = fixed2Formatter
  grid.value.setFormatter(fixed2Formatter, null)
}

function setInteger() {
  format.value = integerFormatter
  grid.value.setFormatter(integerFormatter, null)
}

function setPercent() {
  format.value = percentFormatter
  grid.value.setFormatter(percentFormatter, null)
}

function setSek() {
  format.value = sekFormatter
  grid.value.setFormatter(sekFormatter, null)
}

function setUsd() {
  format.value = usdFormatter
  grid.value.setFormatter(usdFormatter, null)
}

function save() {
  grid.value.setFormatter(format.value ?? defaultFormatter, null)
}
</script>

<template>
  <div>
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
              name="mdi-numeric"
            />
          </div>
        </Button>
        <slot />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="w-[350px]"
      >
        <DropdownMenuCheckboxItem
          :checked="float"
          class="text-sm"
          @update:checked="setFloat"
          @select.prevent
        >
          <div class="flex justify-between gap-8 w-full">
            <div>Float</div>
            <div class="text-gray-500">
              4.1234
            </div>
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="fixed2"
          @update:checked="setFixed2"
          @select.prevent
        >
          <div class="flex justify-between gap-8 w-full">
            <div>Fixed</div>
            <div class="text-gray-500">
              4.10
            </div>
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="integer"
          @update:checked="setInteger"
          @select.prevent
        >
          <div class="flex justify-between gap-8 w-full">
            <div>Integer</div>
            <div class="text-gray-500">
              4
            </div>
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="percent"
          @update:checked="setPercent"
          @select.prevent
        >
          <div class="flex justify-between gap-8 w-full">
            <div>Percent</div>
            <div class="text-gray-500">
              55.00%
            </div>
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="usd"
          @update:checked="setUsd"
          @select.prevent
        >
          <div class="flex justify-between gap-8 w-full">
            <div>USD</div>
            <div class="text-gray-500">
              $4.10
            </div>
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="sek"
          @update:checked="setSek"
          @select.prevent
        >
          <div class="flex justify-between gap-8 w-full">
            <div>SEK</div>
            <div class="text-gray-500">
              4.10 kr
            </div>
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <div class="flex flex-col px-1 pb-2 gap-1">
          <div>
            <div class="flex justify-between text-xs p-1 mt-2">
              <span>Custom Format</span>
              <NuxtLink
                to="https://d3js.org/d3-format"
                class="text-xs text-blue-500 underline"
                target="_blank"
              >Documentation</NuxtLink>
            </div>
            <textarea
              v-model="format"
              class="w-full p-2 text-sm dark:bg-slate-900 bg-white dark:text-gray-300 text-slate-600 font-mono resize-none border dark:border-gray-700 border-gray-300 outline-none rounded-sm"
              rows="4"
              @keydown.stop
            />
          </div>
          <div class="flex justify-between">
            <Button
              variant="secondary"
              size="sm"
              @click="open = false"
            >
              Close
            </Button>
            <Button
              :disabled="format === currentFormatter"
              size="sm"
              @click="save"
            >
              Apply
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
