import { describe, expect, it } from 'vitest'
import { CellReference } from './CellReference'
import { getAutoFillRangeInfo, getNextMultiple } from './utils'
import { RangeReference } from './RangeReference'
import { mockProject } from '~/tests/utils'

const project = mockProject({
  minCols: 10,
  minRows: 10,
})
const grid = project.currentGrid.value

describe('reference utils', () => {
  describe('_getAutoFillDirection', () => {
    it('should return right when the toCell is to the right of the source range and toCell is on the same row as source range', () => {
      // Arrange
      const sourceRange = RangeReference.fromString(grid, 'B2:B2')

      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'Z1'))?.direction).toBe('right')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'Z2'))?.direction).toBe('right')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'Z3'))?.direction).toBe('right')
    })

    it('should return down when the toCell is below the source range and toCell is on the same column as source range', () => {
      const sourceRange = RangeReference.fromString(grid, 'B2:C3')

      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'A9'))?.direction).toBe('down')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'B9'))?.direction).toBe('down')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'C9'))?.direction).toBe('down')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'D9'))?.direction).toBe('down')
    })

    it('should return left when the toCell is to the left of the source range and toCell is on the same row as source range', () => {
      // Arrange
      const sourceRange = RangeReference.fromString(grid, 'D4:D4')

      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'A3'))?.direction).toBe('left')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'B4'))?.direction).toBe('left')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'A5'))?.direction).toBe('left')
    })

    it('should return up when the toCell is below the source range and toCell is on the same column as source range', () => {
      const sourceRange = RangeReference.fromString(grid, 'B4:C5')

      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'A1'))?.direction).toBe('up')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'B1'))?.direction).toBe('up')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'C1'))?.direction).toBe('up')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'D1'))?.direction).toBe('up')
    })

    it('should return favour down in a tie between right and down', () => {
      const sourceRange = RangeReference.fromString(grid, 'B2:C3')

      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'D4'))?.direction).toBe('down')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'D5'))?.direction).toBe('down')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'E4'))?.direction).toBe('right')
      expect(getAutoFillRangeInfo(sourceRange, CellReference.fromString(grid, 'E5'))?.direction).toBe('down')
    })

    it('should return null when the toCell is inside source range', () => {
      // inside source range
      expect(getAutoFillRangeInfo(RangeReference.fromString(grid, 'B2:C3'), CellReference.fromString(grid, 'B3'))).toBeNull()
      // inside source range
      expect(getAutoFillRangeInfo(RangeReference.fromString(grid, 'B2:B2'), CellReference.fromString(grid, 'B2'))).toBeNull()
    })
  })

  describe('getAutoFillRangeInfo', () => {
    it('should return the correct range when autofilling down from cell', () => {
      const source = CellReference.fromString(grid, 'B2')
      const toCell = CellReference.fromString(grid, 'B5')

      const expectedRange = RangeReference.fromString(grid, 'B3:B5')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return the correct range when autofilling down', () => {
      const source = RangeReference.fromString(grid, 'B2:B2')
      const toCell = CellReference.fromString(grid, 'B5')

      const expectedRange = RangeReference.fromString(grid, 'B3:B5')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return the correct range when autofilling up from cell', () => {
      const source = CellReference.fromString(grid, 'B5')
      const toCell = CellReference.fromString(grid, 'B2')

      const expectedRange = RangeReference.fromString(grid, 'B2:B4')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return the correct range when autofilling up', () => {
      const source = RangeReference.fromString(grid, 'B4:C4')
      const toCell = CellReference.fromString(grid, 'A1')

      const expectedRange = RangeReference.fromString(grid, 'B1:C3')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return the correct range when autofilling right from cell', () => {
      const source = CellReference.fromString(grid, 'B2')
      const toCell = CellReference.fromString(grid, 'E2')

      const expectedRange = RangeReference.fromString(grid, 'C2:E2')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return the correct range when autofilling right', () => {
      const source = RangeReference.fromString(grid, 'B2:B2')
      const toCell = CellReference.fromString(grid, 'E2')

      const expectedRange = RangeReference.fromString(grid, 'C2:E2')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return the correct range when autofilling left from cell', () => {
      const source = CellReference.fromString(grid, 'E2')
      const toCell = CellReference.fromString(grid, 'B1')

      const expectedRange = RangeReference.fromString(grid, 'B2:D2')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return the correct range when autofilling left', () => {
      const source = RangeReference.fromString(grid, 'B2:B2')
      const toCell = CellReference.fromString(grid, 'A2')

      const expectedRange = RangeReference.fromString(grid, 'A2:A2')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return null when the toCell is not below or to the right of source range', () => {
      expect(getAutoFillRangeInfo(RangeReference.fromString(grid, 'B2:B2'), CellReference.fromString(grid, 'B2'))).toBe(null)
      expect(getAutoFillRangeInfo(RangeReference.fromString(grid, 'B2:D3'), CellReference.fromString(grid, 'C3'))).toBe(null)
    })

    it('should return the correct range when autofilling a larger range down', () => {
      const source = RangeReference.fromString(grid, 'B2:C3')
      const toCell = CellReference.fromString(grid, 'B6')

      // end on C7, because fill range size is multiple of source range size
      const expectedRange = RangeReference.fromString(grid, 'B4:C7')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })

    it('should return the correct range when autofilling a larger range right', () => {
      const source = RangeReference.fromString(grid, 'B2:C3')
      const toCell = CellReference.fromString(grid, 'E3')

      const expectedRange = RangeReference.fromString(grid, 'D2:E3')

      expect(getAutoFillRangeInfo(source, toCell)?.autoFillRange.toStringWithoutGrid()).toBe(expectedRange.toStringWithoutGrid())
    })
  })
  describe('getNextMultiple', () => {
    it('should return the next multiple of the size for a given value', () => {
      expect(getNextMultiple(5, 12, 100)).toBe(15)
      expect(getNextMultiple(10, 25, 100)).toBe(30)
      expect(getNextMultiple(3, 7, 100)).toBe(9)
    })

    it('should return the next multiple of the size for a given value', () => {
      expect(getNextMultiple(5, 12, 14)).toBe(10)
      expect(getNextMultiple(10, 25, 29)).toBe(20)
      expect(getNextMultiple(3, 7, 6)).toBe(6)
    })

    it('should return the value itself if it is already a multiple of the size', () => {
      expect(getNextMultiple(5, 10, 100)).toBe(10)
      expect(getNextMultiple(7, 21, 100)).toBe(21)
      expect(getNextMultiple(4, 8, 100)).toBe(8)
    })

    it('should throw an error if the size is zero or negative', () => {
      expect(() => getNextMultiple(0, 10, 100)).toThrow('Size must be a positive integer')
      expect(() => getNextMultiple(-5, 10, 100)).toThrow('Size must be a positive integer')
    })
  })
})
