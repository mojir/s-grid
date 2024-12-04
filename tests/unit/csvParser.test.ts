import { describe, expect, it } from 'vitest'
import { parseCsv } from '~/lib/csvParser'

describe('csvParser', () => {
  it('parses csv', async () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6'
    const result = parseCsv(csv)
    expect(result).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])
  })
})
