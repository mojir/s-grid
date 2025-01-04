import { describe, expect, test } from 'vitest'
import { Project } from '~/lib/project/Project'

const project = new Project({
  grids: [
    {
      cells: {
        A1: {
          input: '10',
        },
      },
      rows: 10,
      cols: 10,
      name: 'Grid1',
    },
    {
      cells: {
        A1: {
          input: '=Grid1!A1',
        },
      },
      rows: 10,
      cols: 10,
      name: 'Grid2',
    },
  ],
  currentGridIndex: 0,
  aliases: {},
})

describe('rename grid', () => {
  test('Rename grid should fix all references', () => {
    project.renameGrid(project.getGridByName('Grid1'), 'Foo')

    expect(project.getGridByName('Foo').getCell({ rowIndex: 0, colIndex: 0 }).output.value).toBe(10)
  })
})
