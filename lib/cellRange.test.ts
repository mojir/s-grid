import { describe, test, expect } from 'vitest'
import { CellRange } from './CellRange'
import { CellId } from './CellId'

describe('CellRange', () => {
  test('clamp', () => {
    expect(CellRange.fromId('A1-A1').clamp(CellRange.fromId('A1-J10')).id).toBe('A1-A1')
    expect(CellRange.fromId('ZZ100-ZZ100').clamp(CellRange.fromId('A1-J10')).id).toBe('J10-J10')
    expect(CellRange.fromId('ZZ0-ZZ0').clamp(CellRange.fromId('A1-J10')).id).toBe('J1-J1')
  })

  test('sortSelection', () => {
    expect(CellRange.fromId('A1-B2').toSorted().id).toBe('A1-B2')
    expect(CellRange.fromId('A1-A1').toSorted().id).toBe('A1-A1')
    expect(CellRange.fromId('B1-A1').toSorted().id).toBe('A1-B1')
    expect(CellRange.fromId('A2-A1').toSorted().id).toBe('A1-A2')
    expect(CellRange.fromId('B2-A1').toSorted().id).toBe('A1-B2')
  })

  test('insideSelection', () => {
    expect(CellRange.fromId('A1-A1').contains(CellId.fromId('A1'))).toBe(true)
    expect(CellRange.fromId('A1-B2').contains(CellId.fromId('A1'))).toBe(true)
    expect(CellRange.fromId('A1-B2').contains(CellId.fromId('B2'))).toBe(true)
    expect(CellRange.fromId('A1-B2').contains(CellId.fromId('C3'))).toBe(false)
  })
})
