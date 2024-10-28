import { describe, test, expect } from 'vitest'
import { clampSelection, insideSelection, sortSelection } from './cellId'

describe('cellId utils', () => {
  test('clampSelection', () => {
    expect(clampSelection('A1', 'A1:J10')).toBe('A1')
    expect(clampSelection('ZZ100', 'A1:J10')).toBe('J10')
    expect(clampSelection('ZZ0', 'A1:J10')).toBe('J1')
  })

  test('sortSelection', () => {
    expect(sortSelection('A1:B2')).toBe('A1:B2')
    expect(sortSelection('A1:A1')).toBe('A1:A1')
    expect(sortSelection('B1:A1')).toBe('A1:B1')
    expect(sortSelection('A2:A1')).toBe('A1:A2')
    expect(sortSelection('B2:A1')).toBe('A1:B2')
  })

  test('insideSelection', () => {
    expect(insideSelection('A1', 'A1')).toBe(true)
    expect(insideSelection('A1:B2', 'A1')).toBe(true)
    expect(insideSelection('A1:B2', 'B2')).toBe(true)
    expect(insideSelection('A1:B2', 'C3')).toBe(false)
  })
})