<script setup lang="ts">
import type { GridDTO } from '~/dto/GridDTO'
import type { Project } from '~/lib/project/Project'
import type { SGridComponent } from '~/lib/SGridComponent'

const props = defineProps<{
  project: Project
}>()

const { project } = toRefs(props)

const { testFixtures } = useFixtures()
const { activeInfoLoggers, getLogGridDTO, createLogger, log } = useLogger()

const logger = createLogger('UI').withTag('DebugTab')
const counter = ref(0)

function addGridDto(dto: GridDTO) {
  project.value.importGrid(dto)
  nextTick(() => {
    const grid = project.value.grids.value.find(grid => grid.name.value === getGridName(dto.name))!
    const colIndices = Array.from({ length: grid.cols.value.length }, (_, i) => i)
    grid.autoSetColWidth(colIndices)
  })
}

function displayLog() {
  addGridDto(getLogGridDTO())
}
function logLog() {
  console.log(toRaw(log))
}
</script>

<template>
  <div
    class="flex flex-col w-full text-sm dark:text-slate-400 text-gray-600 gap-4"
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
          v-for="gridDTO of Object.values(testFixtures)"
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
    <div>
      <div class="font-bold text-base mb-2">
        Active info loggers
      </div>
      <div class="flex flex-col gap-1">
        <div
          v-for="infoLogger of Object.keys(activeInfoLoggers)"
          :key="infoLogger"
          class="flex items-center space-x-2"
        >
          <Checkbox
            :id="infoLogger"
            :checked="activeInfoLoggers[infoLogger as SGridComponent]"
            @update:checked="activeInfoLoggers[infoLogger as SGridComponent] = $event"
          />
          <label
            :for="infoLogger"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {{ infoLogger }}
          </label>
        </div>
      </div>
    </div>
    <div class="flex gap-2">
      <Button @click="displayLog">
        Display log
      </Button>
      <Button @click="logLog">
        Log log
      </Button>
    </div>
    <div class="flex flex-col gap-1 w-full items-start">
      <Button
        variant="link"
        class="text-foreground"
        @click="logger.info('An info message', { foo: 'bar' }, [1, 2, 3])"
      >
        Log an info message
      </Button>
      <Button
        variant="link"
        class="text-foreground"
        @click="logger.warn('A warning message')"
      >
        Log a warning message
      </Button>
      <Button
        variant="link"
        class="text-foreground"
        @click="logger.error('An error message')"
      >
        Log an error message
      </Button>
      <Button
        variant="link"
        class="text-foreground"
        @click="logger.throttleInfo(`An throttled info message: ${counter++}`)"
      >
        Log a throttled info message
      </Button>
    </div>
  </div>
</template>
