<script setup lang="ts">
import type { GridProject } from '~/lib/GridProject'

defineProps<{
  gridProject: GridProject
}>()
</script>

<template>
  <div
    class="px-2 flex min-h-10 items-center text-sm dark:bg-slate-800 bg-gray-100 box-border border-t dark:border-slate-700 border-gray-300"
  >
    <div
      class="mr-1 min-w-7 h-7 flex justify-center items-center hover:dark:bg-slate-700 hover:bg-gray-200 rounded-md cursor-pointer"
      @click="gridProject.addGrid()"
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
          v-for="(gridEntry, index) of gridProject.grids.value"
          :key="gridEntry.name"
          :checked="gridProject.gridIndex.value === index"
          @click="gridProject.selectGrid(gridEntry.name)"
        >
          {{ gridEntry.name }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <div class="flex overflow-auto h-full">
      <FooterBarGridButton
        v-for="(gridEntry, index) of gridProject.grids.value"
        :key="gridEntry.name"
        :name="gridEntry.name"
        :selected="index === gridProject.gridIndex.value"
        :removable="gridProject.grids.value.length > 1"
        @select="gridProject.selectGrid(gridEntry.name)"
        @remove="gridProject.removeGrid(gridEntry.name)"
      >
        {{ gridEntry.name }}
      </FooterBarGridButton>
    </div>
  </div>
</template>
