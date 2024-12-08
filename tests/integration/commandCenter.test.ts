import { beforeEach, describe, expect, test } from 'vitest'
import type { CommandCenter } from '~/lib/CommandCenter'
import { Project } from '~/lib/project/Project'

const { getTestFixtures } = useFixtures()
let project: Project
let commandCenter: CommandCenter

beforeEach(() => {
  project = new Project()
  commandCenter = project.commandCenter
})

describe('CommandCenter', () => {
  test('existance', () => {
    expect(commandCenter).toBeDefined()
  })

  describe('commands', () => {
    test('SetInput!', () => {
      commandCenter.exec('SetInput!', 'Hello', 'A1')
      expect(project.currentGrid.value.cells[0][0].input.value).toBe('Hello')
    })
    test('Clear!', async () => {
      const persons = (await getTestFixtures()).persons
      project.importGrid(persons)
      expect(project.currentGrid.value.cells[0][0].input.value).toBe('Albert')
      expect(project.currentGrid.value.cells[1][0].input.value).toBe('Berta')
      commandCenter.exec('Clear!', 'A1')
      expect(project.currentGrid.value.cells[0][0].input.value).toBe('')
      expect(project.currentGrid.value.cells[1][0].input.value).toBe('Berta')
    })
    test('ClearAllCells!', async () => {
      const persons = (await getTestFixtures()).persons

      project.importGrid(persons)
      expect(project.currentGrid.value.cells[0][0].input.value).toBe('Albert')
      expect(project.currentGrid.value.cells[1][0].input.value).toBe('Berta')
      commandCenter.exec('ClearAllCells!', 'A1')
      expect(project.currentGrid.value.cells[0][0].input.value).toBe('')
      expect(project.currentGrid.value.cells[1][0].input.value).toBe('')
    })
  })
})
