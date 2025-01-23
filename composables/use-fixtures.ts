import { createGridDtoFromCsv, type GridDTO } from '~/dto/GridDTO'

type FixtureName = 'persons' | 'usStates' | 'employees' | 'inventory' | 'sales'

const testFixtures = ref<Record<FixtureName, GridDTO> | null>(null)

let resolveLoadTextFixturesPromise: () => void
let rejectLoadTextFixturesPromise: () => void

const loadTextFixturesPromise = new Promise<void>((resolve, reject) => {
  resolveLoadTextFixturesPromise = resolve
  rejectLoadTextFixturesPromise = reject
})

async function getTestFixtures(): Promise<Record<FixtureName, GridDTO>> {
  if (!testFixtures.value) {
    await loadTextFixturesPromise
  }

  return testFixtures.value!
}

async function createTestFixtures() {
  try {
    const personsCsv = (await import('~/fixtures/persons.csv?raw')).default
    const usStatesCsv = (await import('~/fixtures/usStates.csv?raw')).default
    const employeesCsv = (await import('~/fixtures/employees.csv?raw')).default
    const inventoryCsv = (await import('~/fixtures/inventory.csv?raw')).default
    const salesCsv = (await import('~/fixtures/sales.csv?raw')).default

    testFixtures.value = {
      persons: await createGridDtoFromCsv('Names with ages', personsCsv),
      usStates: await createGridDtoFromCsv('US States', usStatesCsv),
      employees: await createGridDtoFromCsv('Employees', employeesCsv),
      inventory: await createGridDtoFromCsv('Inventory', inventoryCsv),
      sales: await createGridDtoFromCsv('Sales', salesCsv),
    }

    resolveLoadTextFixturesPromise()
  }
  catch (error) {
    useDebug().logError('Fixtures', 'Failed to load test fixtures:', error)
    rejectLoadTextFixturesPromise()
    return
  }
}

export default function () {
  if (!testFixtures.value) {
    void createTestFixtures()
  }

  return { testFixtures, getTestFixtures }
}
