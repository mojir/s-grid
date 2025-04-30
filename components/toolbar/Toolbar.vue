<script setup lang="ts">
import type { Project } from '~/lib/project/Project'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)

const { sidePanelOpen } = useSidePanel()
const menuOpen = ref(false)
const renameInput = ref('')
watch(menuOpen, (isOpen) => {
  if (isOpen) {
    renameInput.value = project.value.name.value
  }
  setTimeout(() => project.value.keyboardClaimed.value = isOpen)
})
function renameProject() {
  project.value.name.value = renameInput.value
  menuOpen.value = false
}
function download() {
  // Get the text content from textarea
  const textContent = JSON.stringify(project.value.getDTO(), null, 2)

  // Create a Blob containing the text
  const blob = new Blob([textContent], { type: 'text/plain' })

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob)

  // Create an anchor element for downloading
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.value.name.value}.sgrid.json` // Default filename
  a.style.display = 'none'

  // Append to the document and trigger click
  document.body.appendChild(a)
  a.click()

  // Clean up
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  menuOpen.value = false
}
function load() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.sgrid.json'
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        try {
          const dto = JSON.parse(content as string)
          project.value.setDTO(dto)
        }
        catch {
          project.value.pubSub.publish({
            type: 'Alert',
            eventName: 'error',
            data: {
              title: 'Error loading file',
              body: 'Invalid file format. Please make sure you are uploading a valid .sgrid.json file.',
            },
          })
          return
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}
</script>

<template>
  <div
    class="gap-2 py-1 px-2 w-full flex dark:bg-slate-800 bg-white dark:text-slate-300 text-gray-700 box-border rounded-md drop-shadow-md min-w-[320px] overflow-y-hidden"
  >
    <DropdownMenu
      v-model:open="menuOpen"
    >
      <DropdownMenuTrigger as-child>
        <AppLogo
          class="w-[60px] h-[60px] -ml-2 -my-3 cursor-pointer"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @click="project.clear()">
          <Icon
            name="mdi-file-outline"
            class="w-5 h-5"
          />
          New
        </DropdownMenuItem>
        <DropdownMenuItem @click="load">
          <Icon
            name="mdi-folder-outline"
            class="w-5 h-5"
          />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem @click="download">
          <Icon
            name="mdi-file-download-outline"
            class="w-5 h-5"
          />
          Download
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Icon
              name="mdi-rename-outline"
              class="w-5 h-5 mr-2"
            />
            Rename
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <div class="flex flex-col">
              <input
                v-model="renameInput"
                type="text"
                class="border border-gray-300 dark:border-slate-700 rounded-md p-2"
                @keydown.stop
              >
              <Button
                class="mt-2 bg-blue-500 text-white rounded-md p-2"
                :disabled="renameInput.length === 0 || renameInput === project.name.value"
                @click="renameProject"
              >
                Rename
              </Button>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
    <div class="flex overflow-x-auto flex-1 items-center gap-x-0.5 gap-y-1 [scrollbar-width:none] [-ms-overflow-style:none]">
      <ToolbarUndoButton :project="project" />
      <ToolbarRedoButton
        :project="project"
        class="mr-2"
      />
      <ToolbarPaintButton
        :project="project"
        class="mr-2"
      />
      <ToolbarFontFamilySelector
        :project="project"
      />
      <ToolbarFontSizeSelector
        :project="project"
        class="mr-2"
      />
      <ToolbarBoldButton :project="project" />
      <ToolbarItalicButton :project="project" />
      <ToolbarTextDecorationSwitch
        :project="project"
        class="mr-3"
      />
      <ToolbarJustifySwitch
        :project="project"
        class="mr-3"
      />
      <ToolbarAlignSwitch
        :project="project"
        class="mr-3"
      />
      <ToolbarTextColorPicker :project="project" />
      <ToolbarBackgroundColorPicker
        :project="project"
        class="mr-3"
      />
      <ToolbarFormatterPicker
        :project="project"
        class="mr-1"
      />
    </div>

    <div
      class="items-center dark:text-slate-400 text-gray-600 h-7 w-7 mt-1"
    >
      <Icon
        v-if="!sidePanelOpen"
        name="mdi:menu-open"
        class="cursor-pointer dark:text-gray-400 text-gray-500 hover:dark:text-slate-200 hover:text-black  transition-colors h-7 w-7"
        @click="sidePanelOpen = true"
      />
    </div>
  </div>
</template>
