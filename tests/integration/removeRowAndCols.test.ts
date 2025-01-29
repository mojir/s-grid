import { beforeEach, describe, expect, it } from 'vitest'
import { mockProject } from '../utils'
import type { Project } from '~/lib/project/Project'

let project: Project

beforeEach(() => {
  project = mockProject({
    grid1: {
      cells: {
        A1: { input: 'Kalle' },
        A2: { input: 'Lisa' },
        B1: { input: '12' },
        B2: { input: '13' },
        B3: { input: '=(SUM B1:B2)' },
      },
    },
    grid2: {
      cells: {
        A1: { input: 'Kalle' },
        B1: { input: 'Lisa' },
        A2: { input: '12' },
        B2: { input: '13' },
        C2: { input: '=(SUM A2:B2)' },
      },
    },
  })
})

describe('remove rows and cols', () => {
  describe('removeRow', () => {
    it('should remove first row', async () => {
      const grid = project.currentGrid.value

      expect(grid.getCell({ rowIndex: 2, colIndex: 1 }).output.value).toBe(12 + 13)
      grid.deleteRows(0, 1)
      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).output.value).toBe('Lisa')
      expect(grid.getCell({ rowIndex: 0, colIndex: 1 }).output.value).toBe(13)
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).output.value).toBe(13)
    })

    it('should remove second row', async () => {
      const grid = project.currentGrid.value
      const grid2 = project.getGridByName('Grid2')

      expect(grid.getCell({ rowIndex: 2, colIndex: 1 }).output.value).toBe(12 + 13)
      grid.deleteRows(1, 1)
      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).output.value).toBe('Kalle')
      expect(grid.getCell({ rowIndex: 0, colIndex: 1 }).output.value).toBe(12)
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).output.value).toBe(12)

      // Grid2 should not be affected
      expect(grid2.getCell({ rowIndex: 0, colIndex: 0 }).input.value).toBe('Kalle')
      expect(grid2.getCell({ rowIndex: 0, colIndex: 1 }).input.value).toBe('Lisa')
      expect(grid2.getCell({ rowIndex: 1, colIndex: 0 }).input.value).toBe('12')
      expect(grid2.getCell({ rowIndex: 1, colIndex: 1 }).input.value).toBe('13')
      expect(grid2.getCell({ rowIndex: 1, colIndex: 2 }).input.value).toBe('=(SUM A2:B2)')
    })

    it('should remove first row, then undo', async () => {
      const grid = project.currentGrid.value

      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).input.value).toBe('Kalle')
      expect(grid.getCell({ rowIndex: 1, colIndex: 0 }).input.value).toBe('Lisa')
      expect(grid.getCell({ rowIndex: 0, colIndex: 1 }).input.value).toBe('12')
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).input.value).toBe('13')
      expect(grid.getCell({ rowIndex: 2, colIndex: 1 }).input.value).toBe('=(SUM B1:B2)')
      grid.deleteRows(0, 1)
      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).input.value).toBe('Lisa')
      expect(grid.getCell({ rowIndex: 0, colIndex: 1 }).input.value).toBe('13')
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).input.value).toBe('=(SUM B1:B1)')
      await project.history.undo()
      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).input.value).toBe('Kalle')
      expect(grid.getCell({ rowIndex: 1, colIndex: 0 }).input.value).toBe('Lisa')
      expect(grid.getCell({ rowIndex: 0, colIndex: 1 }).input.value).toBe('12')
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).input.value).toBe('13')
      expect(grid.getCell({ rowIndex: 2, colIndex: 1 }).input.value).toBe('=(SUM B1:B2)')
    })
  })

  describe('removeCol', () => {
    it('should remove first col', async () => {
      project.currentGridIndex.value = 1
      const grid = project.currentGrid.value

      expect(grid.getCell({ rowIndex: 1, colIndex: 2 }).output.value).toBe(12 + 13)
      grid.deleteCols(0, 1)
      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).output.value).toBe('Lisa')
      expect(grid.getCell({ rowIndex: 1, colIndex: 0 }).output.value).toBe(13)
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).output.value).toBe(13)
    })

    it('should remove second col', async () => {
      project.currentGridIndex.value = 1
      const grid = project.currentGrid.value

      expect(grid.getCell({ rowIndex: 1, colIndex: 2 }).output.value).toBe(12 + 13)
      grid.deleteCols(1, 1)
      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).output.value).toBe('Kalle')
      expect(grid.getCell({ rowIndex: 1, colIndex: 0 }).output.value).toBe(12)
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).output.value).toBe(12)
    })

    it('should remove second col, then undo', async () => {
      project.currentGridIndex.value = 1
      const grid = project.currentGrid.value

      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).input.value).toBe('Kalle')
      expect(grid.getCell({ rowIndex: 0, colIndex: 1 }).input.value).toBe('Lisa')
      expect(grid.getCell({ rowIndex: 1, colIndex: 0 }).input.value).toBe('12')
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).input.value).toBe('13')
      expect(grid.getCell({ rowIndex: 1, colIndex: 2 }).input.value).toBe('=(SUM A2:B2)')
      grid.deleteCols(1, 1)
      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).input.value).toBe('Kalle')
      expect(grid.getCell({ rowIndex: 1, colIndex: 0 }).input.value).toBe('12')
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).input.value).toBe('=(SUM A2:A2)')
      await project.history.undo()
      expect(grid.getCell({ rowIndex: 0, colIndex: 0 }).input.value).toBe('Kalle')
      expect(grid.getCell({ rowIndex: 0, colIndex: 1 }).input.value).toBe('Lisa')
      expect(grid.getCell({ rowIndex: 1, colIndex: 0 }).input.value).toBe('12')
      expect(grid.getCell({ rowIndex: 1, colIndex: 1 }).input.value).toBe('13')
      expect(grid.getCell({ rowIndex: 1, colIndex: 2 }).input.value).toBe('=(SUM A2:B2)')
    })
  })
})
