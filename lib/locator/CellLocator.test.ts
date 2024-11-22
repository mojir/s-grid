import { describe, expect, test } from 'vitest'
import { CellLocator } from './CellLocator'

describe('CellLocator', () => {
  test('fromString', () => {
    const locator = CellLocator.fromString('A1')
    expect(locator.externalGrid).toBe(null)
    expect(locator.row).toBe(0)
    expect(locator.col).toBe(0)
    expect(locator.absRow).toBe(false)
    expect(locator.absCol).toBe(false)
  })
  test('fromString with absolute row', () => {
    const locator = CellLocator.fromString('$A1')
    expect(locator.externalGrid).toBe(null)
    expect(locator.absCol).toBe(true)
    expect(locator.col).toBe(0)
    expect(locator.absRow).toBe(false)
    expect(locator.row).toBe(0)
  })
  test('fromString with absolute col', () => {
    const locator = CellLocator.fromString('A$1')
    expect(locator.externalGrid).toBe(null)
    expect(locator.col).toBe(0)
    expect(locator.absCol).toBe(false)
    expect(locator.row).toBe(0)
    expect(locator.absRow).toBe(true)
  })
  test('fromString with external grid', () => {
    const locator = CellLocator.fromString('Grid1!$A$1')
    expect(locator.externalGrid).toBe('Grid1')
    expect(locator.absCol).toBe(true)
    expect(locator.col).toBe(0)
    expect(locator.absRow).toBe(true)
    expect(locator.row).toBe(0)
  })
})
