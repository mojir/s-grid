import { describe, expect, test } from 'vitest'
import { Grid } from './Grid'

describe('useGrid', () => {
  describe('aliases', () => {
    test('create alias will create a cell', () => {
      // Test that the aliases are working correctly
      const grid = new Grid(ref(null), 10, 10, () => {})
      grid.setCellAlias('alias', 'A1')
      expect(grid.getCell('A1')).not.toBe(null)
    })
    test('that a cell can be referenced via alias', () => {
      // Test that the aliases are working correctly
      const grid = new Grid(ref(null), 10, 10, () => {})
      grid.setCellAlias('alias', 'A1')
      expect(grid.getCell('alias')).toBe(grid.getCell('A1'))
    })
    test('that a cell have a function referencing another cell by alias', () => {
      // Test that the aliases are working correctly
      const grid = new Grid(ref(null), 10, 10, () => {})
      grid.getOrCreateCell('A1').input.value = '1'
      grid.setCellAlias('alias', 'A1')
      const A2 = grid.getOrCreateCell('A2')
      A2.input.value = '=alias'
      expect(A2.output.value).toBe(1)
    })
  })
})
