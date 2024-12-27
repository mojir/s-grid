import { describe, expect, test } from 'vitest'
import { maxNumberOfCols, maxNumberOfRows } from '~/lib/constants'
import { getColId, getColIndex, getRowId, getRowIndex } from '~/lib/utils'

describe('utils', () => {
  test('getRowIndex', () => {
    expect(getRowIndex('1')).toBe(0)
    expect(getRowIndex(`${maxNumberOfRows}`)).toBe(maxNumberOfRows - 1)
    expect(() => getRowIndex('0')).toThrow()
    expect(() => getRowIndex(`${maxNumberOfRows + 1}`)).toThrow()
  })

  test('getRowId', () => {
    expect(getRowId(0)).toBe('1')
    expect(getRowId(maxNumberOfRows - 1)).toBe(`${maxNumberOfRows}`)
    expect(() => getRowId(-1)).toThrow()
    expect(() => getRowId(maxNumberOfRows)).toThrow()
  })

  test('all row variants', () => {
    for (let i = 0; i < maxNumberOfRows; i += 1) {
      expect(getRowIndex(getRowId(i))).toBe(i)
    }
  })

  test('getColIndex', () => {
    expect(getColIndex('A')).toBe(0)
    expect(getColIndex('Z')).toBe(25)
    expect(getColIndex('AA')).toBe(26)
    expect(() => getColIndex('')).toThrow()
    expect(() => getColIndex('ZZZ')).toThrow()
  })

  test('getColId', () => {
    expect(getColId(0)).toBe('A')
    expect(getColId(26)).toBe('AA')
    expect(getColId(2 * 26)).toBe('BA')
    expect(getColId(25 * 26)).toBe('YA')
    expect(getColId(maxNumberOfCols - 1)).toBe('ZZ')
    expect(() => getColId(-1)).toThrow()
    expect(() => getColId(maxNumberOfCols)).toThrow()
  })

  test('all col variants', () => {
    for (let i = 0; i < maxNumberOfCols; i += 1) {
      expect(getColIndex(getColId(i))).toBe(i)
    }
  })
})
