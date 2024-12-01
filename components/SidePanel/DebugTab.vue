<script setup lang="ts">
import type { GridDTO } from '~/dto/GridDTO'
import type { GridProject } from '~/lib/GridProject'
import { getGridDisplayName, getGridName } from '~/lib/utils'

const props = defineProps<{
  gridProject: GridProject
}>()

const { gridProject } = toRefs(props)

const testFixtures = useTestFixtures()

function addGridDto(dto: GridDTO) {
  gridProject.value.importGrid(dto)
  setTimeout(() => {
    const grid = gridProject.value.grids.value.find(grid => grid.name === getGridName(dto.name))!.grid
    const colIndices = Array.from({ length: grid.cols.value.length }, (_, i) => i)
    grid.autoSetColWidth(colIndices)
  }, 0)
}
</script>

<template>
  <div
    class="flex flex-col w-full text-sm dark:text-slate-400 text-gray-600 gap-2"
  >
    <div
      v-if="testFixtures"
      class="flex flex-col"
    >
      <div class="font-bold">
        Test grids
      </div>
      <div class="flex flex-col">
        <div
          v-for="gridDTO of testFixtures"
          :key="gridDTO.name"
        >
          <a
            class="cursor-pointer hover:underline pl-2 active:font-bold"
            @click="addGridDto(gridDTO)"
          >
            {{ getGridDisplayName(gridDTO.name) }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
