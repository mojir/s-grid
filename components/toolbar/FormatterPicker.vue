<script setup lang="ts">
import type { WatchHandle } from 'vue'
import type { CellType } from '~/dto/CellDTO'
import { defaultCellType, defaultDateFormatter, defaultNumberFormatter } from '~/lib/constants'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)

const { patternDescriptions } = useDateUtils()

const grid = computed(() => project.value.currentGrid.value)

const open = ref(false)

const currentCellType = computed<CellType>(() => grid.value.getCellType(grid.value.selection.selectedRange.value) ?? defaultCellType)
const currentNumberFormatter = computed(() => grid.value.getNumberFormatter(grid.value.selection.selectedRange.value) ?? defaultNumberFormatter)
const currentDateFormatter = computed(() => grid.value.getDateFormatter(grid.value.selection.selectedRange.value) ?? defaultNumberFormatter)
watch(open, (isOpen) => {
  if (isOpen) {
    cellType.value = currentCellType.value
    numberFormatter.value = currentNumberFormatter.value
    dateFormatter.value = currentDateFormatter.value
  }
  setTimeout(() => project.value.keyboardClaimed.value = isOpen)
})

const tab = ref<'number' | 'date'>('number')

const cellType = ref<CellType | ''>(defaultCellType)
const cellTypeAuto = computed(() => cellType.value === 'auto')
const cellTypeNumber = computed(() => cellType.value === 'number')
const cellTypeDate = computed(() => cellType.value === 'date')
const cellTypeString = computed(() => cellType.value === 'string')

const numberFormatter = ref<string>(defaultNumberFormatter)
const floatFormatter = '#(number:format ".4~f" %)'
const fixed2Formatter = '#(number:format ".2f" %)'
const integerFormatter = '#(number:format "d" %)'
const percentFormatter = '#(str (number:format ".2f" (* % 100)) "%")'
const sekFormatter = '#(str (number:format ".2f" %) " kr")'
const usdFormatter = '#(str "$" (number:format ".2f" %))'

const float = computed(() => numberFormatter.value === floatFormatter)
const fixed2 = computed(() => numberFormatter.value === fixed2Formatter)
const integer = computed(() => numberFormatter.value === integerFormatter)
const percent = computed(() => numberFormatter.value === percentFormatter)
const sek = computed(() => numberFormatter.value === sekFormatter)
const usd = computed(() => numberFormatter.value === usdFormatter)

const dateFormatter = ref<string>(defaultDateFormatter)

let formatWatchHandle: WatchHandle | null = null
let numberFormatterWatchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  cellType.value = grid.value.getCellType(newSelection) ?? ''
  numberFormatter.value = grid.value.getNumberFormatter(newSelection) ?? ''

  const formatRefs = newSelection.getCells().map(cell => cell.cellType)
  formatWatchHandle?.stop()
  formatWatchHandle = watch(formatRefs, () => {
    cellType.value = grid.value.getCellType(newSelection) || ''
  })

  const formatterRefs = newSelection.getCells().map(cell => cell.numberFormatter)

  numberFormatterWatchHandle?.stop()
  numberFormatterWatchHandle = watch(formatterRefs, () => {
    numberFormatter.value = grid.value.getNumberFormatter(newSelection) || ''
  })
}, { immediate: true })

function setCellTypeAuto() {
  cellType.value = 'auto'
  grid.value.setCellType('auto', null)
}

function setCellTypeNumber() {
  cellType.value = 'number'
  grid.value.setCellType('number', null)
}

function setCellTypeDate() {
  cellType.value = 'date'
  grid.value.setCellType('date', null)
}

function setCellTypeString() {
  cellType.value = 'string'
  grid.value.setCellType('string', null)
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

function saveNumberFormatter() {
  grid.value.setNumberFormatter(numberFormatter.value ?? defaultNumberFormatter, null)
}

function saveDateFormatter() {
  grid.value.setDateFormatter(dateFormatter.value ?? defaultDateFormatter, null)
}

function isDateFormatChecked(pattern: string) {
  return dateFormatter.value === getFormatterFromPattern(pattern)
}

function getFormatterFromPattern(pattern: string) {
  return `#(date:format "${pattern}" %)`
}

function setDateFormat(pattern: string) {
  dateFormatter.value = getFormatterFromPattern(pattern)
  grid.value.setDateFormatter(getFormatterFromPattern(pattern), null)
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
          :checked="cellTypeAuto"
          class="text-sm"
          @update:checked="setCellTypeAuto"
          @select.prevent
        >
          Auto
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="cellTypeString"
          class="text-sm"
          @update:checked="setCellTypeString"
          @select.prevent
        >
          String
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="cellTypeNumber"
          class="text-sm"
          @update:checked="setCellTypeNumber"
          @select.prevent
        >
          Number
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          :checked="cellTypeDate"
          class="text-sm"
          @update:checked="setCellTypeDate"
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
                <span>Custom Formatter</span>
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
                @click="saveNumberFormatter"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
        <div v-else>
          <div
            class="max-h-[200px] overflow-y-auto"
          >
            <DropdownMenuCheckboxItem
              v-for="description of patternDescriptions"
              :key="description.pattern"
              class="text-sm"
              :checked="isDateFormatChecked(description.pattern)"
              @update:checked="setDateFormat(description.pattern)"
              @select.prevent
            >
              <div class="flex flex-col w-full text-sm">
                <div>{{ description.pattern }}</div>
                <div class="text-gray-500">
                  {{ description.example }}
                </div>
              </div>
            </DropdownMenuCheckboxItem>
          </div>
          <div class="flex flex-col px-1 pb-2 gap-1">
            <div>
              <div class="flex justify-between text-xs p-1 mt-2">
                <span>Custom Formatter</span>
                <NuxtLink
                  to="https://date-fns.org/docs/format"
                  class="text-xs text-blue-500 underline"
                  target="_blank"
                >Documentation</NuxtLink>
              </div>
              <textarea
                v-model="dateFormatter"
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
                :disabled="dateFormatter === currentDateFormatter"
                size="sm"
                @click="saveDateFormatter"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
