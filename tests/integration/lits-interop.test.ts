import { describe, expect, it } from 'vitest'

const { run } = useLits()

const epochMillis = new Date('2025-01-31T12:34:56.789').valueOf()
const epochSec = new Date('2025-01-31T12:34:56.000').valueOf()
const epochMin = new Date('2025-01-31T12:34:00.000').valueOf()
const epochDate = new Date('2025-01-31T00:00:00.000').valueOf()
const epochMonth = new Date('2025-01-01T00:00:00.000').valueOf()

describe('lits-interop', () => {
  describe('d3', () => {
    describe('format', () => {
      it('should format numbers', () => {
        expect(run('(d3:format "0.2f" 123.456)')).toBe('123.46')
      })
    })
  })

  describe('date-fns', () => {
    describe('date-fns:parse', () => {
      it('should parse dates', () => {
        expect(run('(date-fns:parse "yyyy-MM-dd" "2025-01-31")')).toBe(epochDate)
        expect(run('(date-fns:parse "yyyy-MM-dd HH:mm" "2025-01-31 12:34")')).toBe(epochMin)
      })
    })
    // Intl.DateTimeFormat().resolvedOptions().timeZone
    describe('date-fns:smart-parse', () => {
      it('should smart parse dates', () => {
        expect(run('(date-fns:smart-parse "2025-01-31 12:34:56.789")')).toBe(epochMillis)
        expect(run('(date-fns:smart-parse "2025-01-31 12:34:56")')).toBe(epochSec)
        expect(run('(date-fns:smart-parse "2025-01-31 12:34")')).toBe(epochMin)
        expect(run('(date-fns:smart-parse "2025-01-31")')).toBe(epochDate)
        expect(run('(date-fns:smart-parse "01/31/2025")')).toBe(epochDate)
        expect(run('(date-fns:smart-parse "20250131")')).toBe(epochDate)
        expect(run('(date-fns:smart-parse "2025-01")')).toBe(epochMonth)

        expect(run('(date-fns:smart-parse "January 31, 2025")')).toBe(epochDate)
        expect(run('(date-fns:smart-parse "January 01, 2025")')).toBe(run('(date-fns:smart-parse "January 1, 2025")'))
        expect(run('(date-fns:smart-parse "Jan 31, 2025")')).toBe(epochDate)
        expect(run('(date-fns:smart-parse "31 January 2025")')).toBe(epochDate)
        expect(run('(date-fns:smart-parse "31 Jan 2025")')).toBe(epochDate)
        expect(run('(date-fns:smart-parse "January 2025")')).toBe(epochMonth)
        expect(run('(date-fns:smart-parse "Jan 2025")')).toBe(epochMonth)
      })
    })
  })
})
