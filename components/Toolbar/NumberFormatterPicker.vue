<script setup lang="ts">
import { defaultFormatter } from '~/lib/utils'

const open = ref(false)

const { grid } = useGrid()
const { selection } = useSelection()

const format = ref<string | null>(defaultFormatter)
const floatFormatter = '#(format ".4~f" %)'
const fixed2Formatter = '#(format ".2f" %)'
const integerFormatter = '#(format "d" %)'
const percentFormatter = '#(str (format ".2f" (* % 100)) "%")'
const sekFormatter = '#(str (format ".2f" %) " kr")'
const usdFormatter = '#(str "$" (format ".2f" %))'

const float = computed(() => format.value === floatFormatter)
const fixed2 = computed(() => format.value === fixed2Formatter)
const integer = computed(() => format.value === integerFormatter)
const percent = computed(() => format.value === percentFormatter)
const sek = computed(() => format.value === sekFormatter)
const usd = computed(() => format.value === usdFormatter)

watch(selection, (newSelection) => {
  format.value = grid.value.getFormatter(newSelection)
}, { immediate: true })

function setFloat() {
  format.value = floatFormatter
  grid.value.setFormatter(floatFormatter)
}

function setFixed2() {
  format.value = fixed2Formatter
  grid.value.setFormatter(fixed2Formatter)
}

function setInteger() {
  format.value = integerFormatter
  grid.value.setFormatter(integerFormatter)
}

function setPercent() {
  format.value = percentFormatter
  grid.value.setFormatter(percentFormatter)
}

function setSek() {
  format.value = sekFormatter
  grid.value.setFormatter(sekFormatter)
}

function setUsd() {
  format.value = usdFormatter
  grid.value.setFormatter(usdFormatter)
}

function save() {
  grid.value.setFormatter(format.value ?? defaultFormatter)
  open.value = false
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
      <DropdownMenuContent class="w-[350px]">
        <DropdownMenuCheckboxItem
          :checked="float"
          class="text-sm"
          @update:checked="setFloat"
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
            <div class="text-xs p-1 mt-2">
              Custom Format
            </div>
            <textarea
              v-model="format"
              class="w-full p-2 text-sm dark:bg-slate-900 bg-white dark:text-gray-300 text-slate-600 font-mono resize-none border dark:border-gray-700 border-gray-300 outline-none rounded-sm"
              rows="4"
              @keydown.stop
            />
          </div>
          <div class="flex justify-end gap-4">
            <Button
              variant="secondary"
              size="sm"
              @click="open = false"
            >
              Close
            </Button>
            <Button
              variant="outline"
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
