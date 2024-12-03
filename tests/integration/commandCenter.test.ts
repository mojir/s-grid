import { beforeEach, describe, expect, test } from 'vitest'
import type { CommandCenter } from '~/lib/CommandCenter'
import { GridProject } from '~/lib/GridProject'

const { getTestFixtures } = useFixtures()
let gridProject: GridProject
let commandCenter: CommandCenter

beforeEach(() => {
  gridProject = new GridProject()
  commandCenter = gridProject.commandCenter
})

describe('CommandCenter', () => {
  test('existance', () => {
    expect(commandCenter).toBeDefined()
  })

  describe('commands', () => {
    test('SetInput!', () => {
      commandCenter.exec('SetInput!', 'Hello', 'A1')
      expect(gridProject.currentGrid.value.cells[0][0].input.value).toBe('Hello')
    })
    test('Clear!', async () => {
      const persons = (await getTestFixtures()).persons
      gridProject.importGrid(persons)
      expect(gridProject.currentGrid.value.cells[0][0].input.value).toBe('Albert')
      expect(gridProject.currentGrid.value.cells[1][0].input.value).toBe('Berta')
      commandCenter.exec('Clear!', 'A1')
      expect(gridProject.currentGrid.value.cells[0][0].input.value).toBe('')
      expect(gridProject.currentGrid.value.cells[1][0].input.value).toBe('Berta')
    })
    test('ClearAllCells!', async () => {
      const persons = (await getTestFixtures()).persons

      gridProject.importGrid(persons)
      expect(gridProject.currentGrid.value.cells[0][0].input.value).toBe('Albert')
      expect(gridProject.currentGrid.value.cells[1][0].input.value).toBe('Berta')
      commandCenter.exec('ClearAllCells!', 'A1')
      expect(gridProject.currentGrid.value.cells[0][0].input.value).toBe('')
      expect(gridProject.currentGrid.value.cells[1][0].input.value).toBe('')
    })
  })
})
