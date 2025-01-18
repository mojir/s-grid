import { describe, expect, it } from 'vitest'
import { mockProject } from '../utils'
import { CellReference } from '~/lib/reference/CellReference'
import { RangeReference } from '~/lib/reference/RangeReference'

const project = mockProject({
  grid1: {
    cells: {
      A1: { input: '=C3' },
      A2: { input: '=C4' },
      B1: { input: '=D3' },
      B2: { input: '=D4' },
    },
  },
  minRows: 20,
  minCols: 20,
})

describe('copy paste', () => {
  it('should update reference when copying one cell', async () => {
    const grid = project.currentGrid.value
    const clipboard = project.clipboard

    const fromCell = CellReference.fromString(grid, 'B2')
    const toCell = CellReference.fromString(grid, 'L12')
    const fromRange = RangeReference.fromCellReference(fromCell)
    const toRange = RangeReference.fromCellReference(toCell)

    clipboard.copyRange(fromRange)
    clipboard.pasteSelection(toRange)

    expect(toCell.getCell().input.value).toBe('=N14')
  })

  it('should update reference when copying a range', async () => {
    const grid = project.currentGrid.value
    const clipboard = project.clipboard

    const fromStartCell = CellReference.fromString(grid, 'A1')
    const fromEndCell = CellReference.fromString(grid, 'B2')
    const k11 = CellReference.fromString(grid, 'K11')
    const k12 = CellReference.fromString(grid, 'K12')
    const l11 = CellReference.fromString(grid, 'L11')
    const l12 = CellReference.fromString(grid, 'L12')
    const fromRange = RangeReference.fromCellReferences(fromStartCell, fromEndCell)
    const toRange = RangeReference.fromCellReferences(k11, l12)

    clipboard.copyRange(fromRange)
    clipboard.pasteSelection(toRange)

    expect(k11.getCell().input.value).toBe('=M13')
    expect(k12.getCell().input.value).toBe('=M14')
    expect(l11.getCell().input.value).toBe('=N13')
    expect(l12.getCell().input.value).toBe('=N14')
  })

  it('should update reference when copying a small range into a larger', async () => {
    const grid = project.currentGrid.value
    const clipboard = project.clipboard

    const fromStartCell = CellReference.fromString(grid, 'A1')
    const fromEndCell = CellReference.fromString(grid, 'B2')
    const k11 = CellReference.fromString(grid, 'K11')
    const k12 = CellReference.fromString(grid, 'K12')
    const k13 = CellReference.fromString(grid, 'K13')
    const k14 = CellReference.fromString(grid, 'K14')
    const l11 = CellReference.fromString(grid, 'L11')
    const l12 = CellReference.fromString(grid, 'L12')
    const l13 = CellReference.fromString(grid, 'L13')
    const l14 = CellReference.fromString(grid, 'L14')
    const m11 = CellReference.fromString(grid, 'M11')
    const m12 = CellReference.fromString(grid, 'M12')
    const m13 = CellReference.fromString(grid, 'M13')
    const m14 = CellReference.fromString(grid, 'M14')
    const n11 = CellReference.fromString(grid, 'N11')
    const n12 = CellReference.fromString(grid, 'N12')
    const n13 = CellReference.fromString(grid, 'N13')
    const n14 = CellReference.fromString(grid, 'N14')
    const fromRange = RangeReference.fromCellReferences(fromStartCell, fromEndCell)
    const toRange = RangeReference.fromCellReferences(k11, n14)

    clipboard.copyRange(fromRange)
    clipboard.pasteSelection(toRange)

    expect(k11.getCell().input.value).toBe('=M13')
    expect(k12.getCell().input.value).toBe('=M14')
    expect(k13.getCell().input.value).toBe('=M15')
    expect(k14.getCell().input.value).toBe('=M16')
    expect(l11.getCell().input.value).toBe('=N13')
    expect(l12.getCell().input.value).toBe('=N14')
    expect(l13.getCell().input.value).toBe('=N15')
    expect(l14.getCell().input.value).toBe('=N16')
    expect(m11.getCell().input.value).toBe('=O13')
    expect(m12.getCell().input.value).toBe('=O14')
    expect(m13.getCell().input.value).toBe('=O15')
    expect(m14.getCell().input.value).toBe('=O16')
    expect(n11.getCell().input.value).toBe('=P13')
    expect(n12.getCell().input.value).toBe('=P14')
    expect(n13.getCell().input.value).toBe('=P15')
    expect(n14.getCell().input.value).toBe('=P16')
  })
})
