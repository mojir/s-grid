<script setup lang="ts">
import { isLitsFunction } from '@mojir/lits'
import type { Project } from '~/lib/project/Project'
import type { Reference } from '~/lib/reference/utils'

const props = defineProps<{
  project: Project
}>()

const aliases = computed(() => {
  return Object.entries(project.value.aliases.aliases.value)
    .map(([alias, reference]) => ({ alias, reference: reference.value }))
})

const { project } = toRefs(props)
const editAliasDialogOpen = ref(false)
const removeAliasDialogOpen = ref(false)
const currentAlias = ref('')
const currentReference = ref('')

function addAlias() {
  currentAlias.value = ''
  currentReference.value = ''
  editAliasDialogOpen.value = true
}
function editAlias(alias: string, reference: string) {
  currentAlias.value = alias
  currentReference.value = reference
  editAliasDialogOpen.value = true
}
function removeAlias(alias: string) {
  currentAlias.value = alias
  removeAliasDialogOpen.value = true
}
function focus(reference: Reference) {
  project.value.selectGrid(reference.grid)
  project.value.currentGrid.value.selection.select(reference.toRangeReference())
  project.value.currentGrid.value.position.value = reference.toRangeReference().start
}

function getDisplayValue(output: unknown) {
  if (output instanceof Error) {
    return '#ERR'
  }
  if (isLitsFunction(output)) {
    return 'λ'
  }
  return JSON.stringify(output)
}
</script>

<template>
  <div
    class="flex flex-col w-full text-sm text-primary-foreground gap-2"
  >
    <div>
      <div class="font-bold text-lg">
        Aliases
      </div>
      <div>
        Aliases are shortcuts for referencing other cells or ranges of cells. They can be used in formulas to reference other cells.
      </div>
      <div>
        <Button
          class="mt-2"
          @click="addAlias()"
        >
          Add Alias
        </Button>
      </div>
    </div>
    <div v-if="aliases.length === 0">
      No Aliases
    </div>
    <div
      v-else
    >
      <div class="flex gap-2 text-sm font-bold">
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          Alias
        </div>
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          Reference
        </div>
        <div class="w-6/12 overflow-hidden truncate text-ellipsis">
          Output
        </div>
      </div>
      <div
        v-for="alias in aliases"
        :key="alias.alias"
        class="flex gap-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          {{ alias.alias }}
        </div>
        <div class="w-3/12 overflow-hidden truncate text-ellipsis">
          {{ alias.reference.toStringWithGrid() }}
        </div>
        <div class="w-6/12 gap-4 flex overflow-hidden">
          <div class="w-9/12 overflow-hidden truncate text-ellipsis">
            {{ getDisplayValue(alias.reference.getOutput()) }}
          </div>
          <div class="w-3/12 flex gap-2 justify-end items-center">
            <Button
              variant="link"
              class="p-0 m-0 h-auto"
              @click="focus(alias.reference)"
            >
              <Icon
                name="mdi-eye"
                class="w-4 h-4 text-primary-foreground"
              />
            </Button>
            <Button
              variant="link"
              class="p-0 m-0 h-auto"
              @click="editAlias(alias.alias, alias.reference.toStringWithGrid())"
            >
              <Icon
                name="mdi-pencil"
                class="w-4 h-4 text-primary-foreground"
              />
            </Button>
            <Button
              variant="link"
              class="p-0 m-0 h-auto"
              @click="removeAlias(alias.alias)"
            >
              <Icon
                name="mdi-trash"
                class="w-4 h-4 text-primary-foreground"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <DialogEditAlias
    v-model:open="editAliasDialogOpen"
    :project="project"
    :alias="currentAlias"
    :reference="currentReference"
    @close="editAliasDialogOpen = false"
  />
  <DialogRemoveAlias
    v-model:open="removeAliasDialogOpen"
    :project="project"
    :alias="currentAlias"
  />
</template>
