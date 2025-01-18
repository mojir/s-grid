import { describe, expect, it } from 'vitest'
import { defaultColWidth, defaultRowHeight } from '~/lib/constants'
import { Rectangle } from '~/lib/layout/Rectangle'
import { CellReference } from '~/lib/reference/CellReference'
import { RangeReference } from '~/lib/reference/RangeReference'
import { mockProject } from '~/tests/utils'

const project = mockProject()

describe('the Rectangle class', () => {
  it('should be able to be created via a Reference A1', () => {
    const grid = project.getGridByName('Grid1')
    const cellReference = CellReference.fromString(grid, 'A1')
    const rectangle = Rectangle.fromReference(cellReference)

    expect(rectangle.x).toBe(0)
    expect(rectangle.y).toBe(0)
    expect(rectangle.width).toBe(defaultColWidth)
    expect(rectangle.height).toBe(defaultRowHeight)
    expect(rectangle.area()).toBe(defaultColWidth * defaultRowHeight)
  })

  it('should be able to be created via a Reference B2', () => {
    const grid = project.getGridByName('Grid1')
    const cellReference = CellReference.fromString(grid, 'B2')
    const rectangle = Rectangle.fromReference(cellReference)

    expect(rectangle.x).toBe(defaultColWidth)
    expect(rectangle.y).toBe(defaultRowHeight)
    expect(rectangle.width).toBe(defaultColWidth)
    expect(rectangle.height).toBe(defaultRowHeight)
  })

  it('should be able to be created via a Reference A1:B2', () => {
    const grid = project.getGridByName('Grid1')
    const rangeReference = RangeReference.fromString(grid, 'A1:B2')
    const rectangle = Rectangle.fromReference(rangeReference)

    expect(rectangle.x).toBe(0)
    expect(rectangle.y).toBe(0)
    expect(rectangle.width).toBe(defaultColWidth * 2)
    expect(rectangle.height).toBe(defaultRowHeight * 2)
  })
})
