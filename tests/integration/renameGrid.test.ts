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
    project.commandCenter.exec('AddAlias!', 'X', 'Grid1!A1')

    expect(project.commandCenter.exec('GetOutput', 'X')).toBe(10)

    project.renameGrid(project.getGridByName('Grid1'), 'Foo')

    expect(project.commandCenter.exec('GetOutput', 'X')).toBe(10)
    expect(project.getGridByName('Foo').getCell({ rowIndex: 0, colIndex: 0 }).output.value).toBe(10)
  })
})
