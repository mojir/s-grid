import { describe, expect, test } from 'vitest'
import { Grid } from './Grid'
import { Row } from './Row'
import { Col } from './Col'

const rows = shallowRef<Row[]>(Array.from({ length: 10 }, (_, rowIndex) => Row.create(rowIndex, 0)))
const cols = shallowRef<Col[]>(Array.from({ length: 10 }, (_, colIndex) => Col.create(colIndex, 0)))

const { setAlias } = useAlias()

describe('useGrid', () => {
  describe('aliases', () => {
    test('that a cell can be referenced via alias', () => {
      // Test that the aliases are working correctly
      const grid = new Grid(ref(null), rows, cols)
      setAlias('alias1', grid.getCell('A1'))
      expect(grid.getCell('alias1')).toBe(grid.getCell('A1'))
    })
    test('that a cell have a function referencing another cell by alias', () => {
      // Test that the aliases are working correctly
      const grid = new Grid(ref(null), rows, cols)
      grid.getCell('A1').input.value = '1'
      setAlias('alias2', grid.getCell('A1'))
      const A2 = grid.getCell('A2')
      A2.input.value = '=alias2'
      expect(A2.output.value).toBe(1)
    })
  })
})
