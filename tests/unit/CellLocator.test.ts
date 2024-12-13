import { describe, expect, test } from 'vitest'
import { CellLocator } from '~/lib/locators/CellLocator'
import { Project } from '~/lib/project/Project'

const project = new Project()
project.importGrid({
  name: 'Grid2',
  rows: 10,
  cols: 10,
  cells: {},
})
project.selectGrid('Grid1')

const grid1 = project.currentGrid.value

describe('CellLocator', () => {
  test('fromString', () => {
    const locator = CellLocator.fromString(grid1, 'A1')
    expect(locator.grid.name.value).toBe('Grid1')
    expect(locator.row).toBe(0)
    expect(locator.col).toBe(0)
    expect(locator.absRow).toBe(false)
    expect(locator.absCol).toBe(false)
  })
  test('fromString with absolute row', () => {
    const locator = CellLocator.fromString(grid1, '$A1')
    expect(locator.grid.name.value).toBe('Grid1')
    expect(locator.absCol).toBe(true)
    expect(locator.col).toBe(0)
    expect(locator.absRow).toBe(false)
    expect(locator.row).toBe(0)
  })
  test('fromString with absolute col', () => {
    const locator = CellLocator.fromString(grid1, 'A$1')
    expect(locator.grid.name.value).toBe('Grid1')
    expect(locator.col).toBe(0)
    expect(locator.absCol).toBe(false)
    expect(locator.row).toBe(0)
    expect(locator.absRow).toBe(true)
  })
  test('fromString with external grid', () => {
    const locator = CellLocator.fromString(grid1, 'Grid2!$A$1')
    expect(locator.grid.name.value).toBe('Grid2')
    expect(locator.absCol).toBe(true)
    expect(locator.col).toBe(0)
    expect(locator.absRow).toBe(true)
    expect(locator.row).toBe(0)
  })
})
