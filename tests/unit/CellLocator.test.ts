import { describe, expect, test } from 'vitest'
import { mockProject } from '../utils'
import { CellReference } from '~/lib/reference/CellReference'

const project = mockProject()

const grid1 = project.currentGrid.value

describe('CellReference', () => {
  test('fromString', () => {
    const reference = CellReference.fromString(grid1, 'A1')
    expect(reference.grid.name.value).toBe('Grid1')
    expect(reference.rowIndex).toBe(0)
    expect(reference.colIndex).toBe(0)
    expect(reference.absRow).toBe(false)
    expect(reference.absCol).toBe(false)
  })
  test('fromString with absolute row', () => {
    const reference = CellReference.fromString(grid1, '$A1')
    expect(reference.grid.name.value).toBe('Grid1')
    expect(reference.absCol).toBe(true)
    expect(reference.colIndex).toBe(0)
    expect(reference.absRow).toBe(false)
    expect(reference.rowIndex).toBe(0)
  })
  test('fromString with absolute col', () => {
    const reference = CellReference.fromString(grid1, 'A$1')
    expect(reference.grid.name.value).toBe('Grid1')
    expect(reference.colIndex).toBe(0)
    expect(reference.absCol).toBe(false)
    expect(reference.rowIndex).toBe(0)
    expect(reference.absRow).toBe(true)
  })
  test('fromString with external grid', () => {
    const reference = CellReference.fromString(grid1, 'Grid2!$A$1')
    expect(reference.grid.name.value).toBe('Grid2')
    expect(reference.absCol).toBe(true)
    expect(reference.colIndex).toBe(0)
    expect(reference.absRow).toBe(true)
    expect(reference.rowIndex).toBe(0)
  })
})
