import { describe, expect, it } from 'vitest'
import { mockProject } from '../../tests/utils'
import { CellReference } from '~/lib/reference/CellReference'

const project = mockProject()

const grid1 = project.currentGrid.value

describe('Grid', () => {
  describe('Spill', () => {
    it('should update cells', async () => {
      const a1 = CellReference.fromString(grid1, 'A1')
      const a2 = CellReference.fromString(grid1, 'A2')
      const a3 = CellReference.fromString(grid1, 'A3')
      a1.getCell().input.value = '=[1, 2, 3]'
      await nextTick()
      expect(a1.getCell().spillValue.value?.value).toBe(1)
      expect(a1.getCell().output.value).toBe(1)
      expect(a2.getCell().spillValue.value?.value).toBe(2)
      expect(a2.getCell().output.value).toBe(2)
      expect(a3.getCell().spillValue.value?.value).toBe(3)
      expect(a3.getCell().output.value).toBe(3)
    })
  })
})
