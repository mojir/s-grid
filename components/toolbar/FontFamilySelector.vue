<script setup lang="ts">
import type { WatchHandle } from 'vue'
import { fontFamilies, isFontFamily, toFontFamilyCss, type StyleFontFamily } from '~/dto/CellDTO'
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const sansSerifFonts = fontFamilies.filter(font => font.split(':')[0] === 'sans-serif')
const serifFonts = fontFamilies.filter(font => font.split(':')[0] === 'serif')
const monospaceFonts = fontFamilies.filter(font => font.split(':')[0] === 'monospace')
const cursiveFonts = fontFamilies.filter(font => font.split(':')[0] === 'cursive')

const { project } = toRefs(props)
const grid = computed(() => project.value.currentGrid.value)

const fontFamily = ref<StyleFontFamily | undefined>()

let watchHandle: WatchHandle | null = null
watch(grid.value.selection.selectedRange, (newSelection) => {
  const selectedFontFamily = grid.value.getFontFamily(newSelection)
  fontFamily.value = selectedFontFamily ?? undefined

  const fontFamilyRefs = newSelection.getCells().map(cell => cell.fontFamily)

  watchHandle?.stop()
  watchHandle = watch(fontFamilyRefs, () => {
    const selectedFontFamily = grid.value.getFontFamily(newSelection)
    fontFamily.value = selectedFontFamily ?? undefined
  })
}, { immediate: true })

function onUpdateFontFamily(value: string) {
  if (!value || !isFontFamily(value)) {
    return
  }
  fontFamily.value = value
  // TODO should we be more explicit and always pass in reference?
  grid.value.setFontFamily(value, null)
  grid.value.autoSetRowHeight({ selection: true })
}
function onOpen(open: boolean) {
  setTimeout(() => project.value.keyboardClaimed.value = open)
}
</script>

<template>
  <div
    class="px-1 h-6 -mt-2  bg-transparent rounded-sm cursor-pointer text-sm"
  >
    <Select
      :model-value="fontFamily"
      @update:model-value="onUpdateFontFamily"
      @update:open="onOpen"
    >
      <SelectTrigger class="w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel class="-ml-6">
            Sans Serif
          </SelectLabel>
          <SelectItem
            v-for="font of sansSerifFonts"
            :key="font"
            :style="{ fontFamily: toFontFamilyCss(font) }"
            :value="font"
          >
            {{ font.split(':')[1] }}
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel class="-ml-6 pt-4">
            Serif
          </SelectLabel>
          <SelectItem
            v-for="font of serifFonts"
            :key="font"
            :style="{ fontFamily: toFontFamilyCss(font) }"
            :value="font"
          >
            {{ font.split(':')[1] }}
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel class="-ml-6 pt-4">
            Monospace
          </SelectLabel>
          <SelectItem
            v-for="font of monospaceFonts"
            :key="font"
            :style="{ fontFamily: toFontFamilyCss(font) }"
            :value="font"
          >
            {{ font.split(':')[1] }}
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel class="-ml-6 pt-4">
            Other
          </SelectLabel>
          <SelectItem
            v-for="font of cursiveFonts"
            :key="font"
            :style="{ fontFamily: toFontFamilyCss(font) }"
            :value="font"
          >
            {{ font.split(':')[1] }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
