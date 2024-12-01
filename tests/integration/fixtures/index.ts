import personsCsv from './persons.csv?raw'
import usStatesCsv from './usStates.csv?raw'
import employeesCsv from './employees.csv?raw'
import inventoryCsv from './inventory.csv?raw'
import salesCsv from './sales.csv?raw'
import { createGridDtoFromCsv, type GridDTO } from '~/dto/GridDTO'

export const persons = createGridDtoFromCsv('Names with ages', personsCsv)
export const usStates = createGridDtoFromCsv('US States', usStatesCsv)
export const employees = createGridDtoFromCsv('Employees', employeesCsv)
export const inventory = createGridDtoFromCsv('Inventory', inventoryCsv)
export const sales = createGridDtoFromCsv('Sales', salesCsv)

const testFixtures: GridDTO[] = [
  employees,
  inventory,
  persons,
  sales,
  usStates,
]

export default testFixtures
