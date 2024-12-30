<script setup lang="ts">
import type { Project } from '~/lib/project/Project'
import { getGridDisplayName } from '~/lib/utils'

defineProps<{
  project: Project
}>()
</script>

<template>
  <div>
    <InfoBar :project="project" />
    <div
      class="px-2 flex h-10 items-center text-sm dark:bg-slate-800 bg-gray-100 box-border border-t dark:border-slate-700 border-gray-300"
    >
      <div
        class="mr-1 min-w-7 h-7 flex justify-center items-center hover:dark:bg-slate-700 hover:bg-gray-200 rounded-md cursor-pointer"
        @click="project.addGrid()"
      >
        <Icon
          name="mdi-plus"
          class="w-5 h-5"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          class="mr-2 min-w-7 h-7 flex justify-center items-center hover:dark:bg-slate-700 hover:bg-gray-200 rounded-md cursor-pointer"
        >
          <Icon
            name="mdi-menu"
            class="w-5 h-5"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent class="flex flex-col max-h-96 overflow-y-auto">
          <DropdownMenuCheckboxItem
            v-for="grid of project.grids.value"
            :key="grid.name.value"
            :checked="project.currentGrid.value === grid"
            @click="project.selectGrid(grid)"
          >
            {{ getGridDisplayName(grid.name.value) }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div class="flex overflow-auto h-full">
        <FooterBarGridButton
          v-for="grid of project.grids.value"
          :key="grid.name.value"
          :selected="grid === project.currentGrid.value"
          :removable="project.grids.value.length > 1"
          :grid="grid"
          :project="project"
        >
          {{ getGridDisplayName(grid.name.value) }}
        </FooterBarGridButton>
      </div>
    </div>
  </div>
</template>
