<script setup lang="ts">
import type { WatchHandle } from 'vue'
import type { Format } from '~/dto/CellDTO'
import { defaultFormat, defaultNumberFormatter } from '~/lib/constants'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const open = ref(false)

const currentFormat = computed<Format>(() => grid.value.getFormat(grid.value.selection.selectedRange.value) ?? defaultFormat)
const currentNumberFormatter = computed(() => grid.value.getNumberFormatter(grid.value.selection.selectedRange.value) ?? defaultNumberFormatter)
watch(open, (isOpen) => {
  if (isOpen) {
    format.value = currentFormat.value
    numberFormatter.value = currentNumberFormatter.value
  }
  setTimeout(() => project.value.keyboardClaimed.value = isOpen)
})

const tab = ref<'number' | 'date'>('number')

const format = ref<Format | ''>(defaultFormat)
const formatAuto = computed(() => format.value === 'auto')
const formatNumber = computed(() => format.value === 'number')
const formatDate = computed(() => format.value === 'date')
const formatString = computed(() => format.value === 'string')

const numberFormatter = ref<string>(defaultNumberFormatter)
const floatFormatter = '#(d3:format ".4~f" %)'
const fixed2Formatter = '#(d3:format ".2f" %)'
const integerFormatter = '#(d3:format "d" %)'
const percentFormatter = '#(str (d3:format ".2f" (* % 100)) "%")'
const sekFormatter = '#(str (d3:format ".2f" %) " kr")'
const usdFormatter = '#(str "$" (d3:format ".2f" %))'

const float = computed(() => numberFormatter.value === floatFormatter)
const fixed2 = computed(() => numberFormatter.value === fixed2Formatter)
const integer = computed(() => numberFormatter.value === integerFormatter)
const percent = computed(() => numberFormatter.value === percentFormatter)
const sek = computed(() => numberFormatter.value === sekFormatter)
const usd = computed(() => numberFormatter.value === usdFormatter)

let formatWatchHandle: WatchHandle | null = null
let numberFormatterWatchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  format.value = grid.value.getFormat(newSelection) ?? ''
  numberFormatter.value = grid.value.getNumberFormatter(newSelection) ?? ''

  const formatRefs = newSelection.getCells().map(cell => cell.format)
  formatWatchHandle?.stop()
  formatWatchHandle = watch(formatRefs, () => {
    format.value = grid.value.getFormat(newSelection) || ''
  })

  const formatterRefs = newSelection.getCells().map(cell => cell.numberFormatter)

  numberFormatterWatchHandle?.stop()
  numberFormatterWatchHandle = watch(formatterRefs, () => {
    numberFormatter.value = grid.value.getNumberFormatter(newSelection) || ''
  })
}, { immediate: true })

function setFormatAuto() {
  format.value = 'auto'
  grid.value.setFormat('auto', null)
}

function setFormatNumber() {
  format.value = 'number'
  grid.value.setFormat('number', null)
}

function setFormatDate() {
  format.value = 'date'
  grid.value.setFormat('date', null)
}

function setFormatString() {
  format.value = 'string'
  grid.value.setFormat('string', null)
}

function setFloat() {
  numberFormatter.value = floatFormatter
  grid.value.setNumberFormatter(floatFormatter, null)
}

function setFixed2() {
  numberFormatter.value = fixed2Formatter
  grid.value.setNumberFormatter(fixed2Formatter, null)
}

function setInteger() {
  numberFormatter.value = integerFormatter
  grid.value.setNumberFormatter(integerFormatter, null)
}

function setPercent() {
  numberFormatter.value = percentFormatter
  grid.value.setNumberFormatter(percentFormatter, null)
}

function setSek() {
  numberFormatter.value = sekFormatter
  grid.value.setNumberFormatter(sekFormatter, null)
}

function setUsd() {
  numberFormatter.value = usdFormatter
  grid.value.setNumberFormatter(usdFormatter, null)
}

function save() {
  grid.value.setNumberFormatter(numberFormatter.value ?? defaultNumberFormatter, null)
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
          :checked="formatAuto"
          class="text-sm"
          @update:checked="setFormatAuto"
          @select.prevent
        >
          Auto
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="formatString"
          class="text-sm"
          @update:checked="setFormatString"
          @select.prevent
        >
          String
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="formatNumber"
          class="text-sm"
          @update:checked="setFormatNumber"
          @select.prevent
        >
          Number
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="formatDate"
          class="text-sm"
          @update:checked="setFormatDate"
          @select.prevent
        >
          Date
        </DropdownMenuCheckboxItem>

        <div class="flex justify-between mt-4 text-sm border-b-2 -mx-1">
          <div
            :class="{
              'bg-primary': tab === 'number',
              'cursor-pointer': tab !== 'number',
            }"
            class="py-0.5 w-1/2 text-center"
            @click="tab = 'number'"
          >
            Number format
          </div>
          <div
            :class="{
              'bg-primary': tab === 'date',
              'cursor-pointer': tab !== 'date',
            }"
            class="py-0.5 w-1/2 text-center"
            @click="tab = 'date'"
          >
            Date format
          </div>
        </div>
        <div v-if="tab === 'number'">
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
                v-model="numberFormatter"
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
                :disabled="numberFormatter === currentNumberFormatter"
                size="sm"
                @click="save"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
        <div v-else>
          Date formate here
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
