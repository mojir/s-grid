import { describe, expect, it } from 'vitest'
import { parseCsv } from '~/lib/csvParser'

describe('csvParser', () => {
  it('parses csv commas', async () => {
    const csv = '",",,\''
    const result = parseCsv(csv)
    expect(result).toEqual([
      [',', '', '\''],
    ])
  })
  it('parses csv quotes 1', async () => {
    const csv = '"""foo"""'
    const result = parseCsv(csv)
    expect(result).toEqual([
      ['"foo"'],
    ])
  })
  it('parses csv quotes 2', async () => {
    const csv = '"foo"'
    const result = parseCsv(csv)
    expect(result).toEqual([
      ['foo'],
    ])
  })
  it('parses csv quotes 3', async () => {
    const csv = '"foo",baz'
    const result = parseCsv(csv)
    expect(result).toEqual([
      ['foo', 'baz'],
    ])
  })
  it('parses csv', async () => {
    const csv = 'a,b,c\n\n1,2,3\n4,5,6\n"""foo""","bar", "baz"'
    const result = parseCsv(csv)
    expect(result).toEqual([
      ['a', 'b', 'c'],
      [],
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['"foo"', 'bar', ' "baz"'],
    ])
  })
})
