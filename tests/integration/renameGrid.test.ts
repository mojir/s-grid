import { describe, expect, test } from 'vitest'
import { mockProject } from '../utils'

const project = mockProject({
  grid1: {
    cells: {
      A1: { input: '10' },
    },
  },
  grid2: {
    cells: {
      A1: { input: '=Grid1!A1' },
    },
  },
})

describe('rename grid', () => {
  test('Rename grid should fix all references', () => {
    project.renameGrid(project.getGridByName('Grid1'), 'Foo')

    expect(project.getGridByName('Foo').getCell({ rowIndex: 0, colIndex: 0 }).output.value).toBe(10)
  })
})
