<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import type { Diagram } from '~/lib/Diagram'
import type { Project } from '~/lib/project/Project'
import { getDiagramId, type Reference } from '~/lib/reference/utils'
import { RangeReference } from '~/lib/reference/RangeReference'
import { isMatrixShaped, matrix, type Matrix } from '~/lib/matrix'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
)
const props = defineProps<{
  project: Project
  diagram: Diagram
}>()

const { diagram, project } = toRefs(props)

const diagramId = computed(() => getDiagramId(diagram.value))
const active = computed(() => project.value.diagrams.activeDiagram.value === diagram.value)

const values = computed<(number | null)[]>(() => {
  const dataReference = diagram.value.dataReference.value
  const m = dataReference ? getMatrixFromReference(dataReference) : null

  console.log('m', m?.unbox())
  return m?.filterNumbers().cols()[0] ?? []
})

function getMatrixFromReference(reference: Reference): Matrix<unknown> | null {
  if (reference instanceof RangeReference) {
    return reference.getCellMatrix().map(cell => cell.output.value)
  }

  const cellOutput = reference.getCell().output.value
  return isMatrixShaped(cellOutput) ? matrix(cellOutput) : null
}

const chartData = computed<ChartData<'line'>>(() => {
  return {
    labels: values.value.map((_, index) => `${index + 1}`),
    datasets: [{ data: values.value, label: 'Output', borderColor: 'rgb(75, 192, 192)', fill: false, tension: 0.1 }],
  }
})

const chartOptions: ChartOptions<'line'> = {
  indexAxis: 'x',
  responsive: true,
  maintainAspectRatio: false,
  normalized: false,
  scales: {
    x: {
      display: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Time',
      },
      bounds: 'ticks',
      clip: false,
      suggestedMin: -10,
    },
    y: {
      display: true,
    },
  },
}
</script>

<template>
  <Floater
    :id="diagramId"
    v-model:rectangle="diagram.rectangle.value"
    :active="active"
  >
    <Line
      :data="chartData"
      :options="chartOptions"
    />
  </Floater>
</template>
