import { describe, expect, it } from 'vitest'

const { run } = useLits()

const epochMillis = new Date('2025-01-31T12:34:56.789').valueOf()
const epochSec = new Date('2025-01-31T12:34:56.000').valueOf()
const epochMin = new Date('2025-01-31T12:34:00.000').valueOf()
const epochDate = new Date('2025-01-31T00:00:00.000').valueOf()
const epochMonth = new Date('2025-01-01T00:00:00.000').valueOf()

describe('lits-interop', () => {
  describe('format', () => {
    it('should format numbers', () => {
      expect(run('(format "0.2f" 123.456)')).toBe('123.46')
    })
  })

  describe('timeFormat', () => {
    it('should format dates', () => {
      expect(run(`(time-format "%Y-%m-%d" ${epochMillis})`)).toBe('2025-01-31')
      expect(run(`(time-format "%b %Y" ${epochMillis})`)).toBe('Jan 2025')
    })
  })

  describe('timeParse', () => {
    it('should parse dates', () => {
      expect(run('(time-parse "%Y-%m-%d" "2025-01-31")')).toBe(epochDate)
      expect(run('(time-parse "%Y-%m-%d" "2025-01-31")')).toBe(epochDate)
    })
  })

  describe('smartTimeParse', () => {
    it('should parse dates', () => {
      expect(run('(smart-time-parse "2025-01-31 12:34:56.789")')).toBe(epochMillis)
      expect(run('(smart-time-parse "2025-01-31 12:34:56")')).toBe(epochSec)
      expect(run('(smart-time-parse "2025-01-31 12:34")')).toBe(epochMin)
      expect(run('(smart-time-parse "2025-01-31")')).toBe(epochDate)
      expect(run('(smart-time-parse "01/31/2025")')).toBe(epochDate)
      expect(run('(smart-time-parse "20250131")')).toBe(epochDate)
      expect(run('(smart-time-parse "2025-01")')).toBe(epochMonth)

      expect(run('(smart-time-parse "January 31, 2025")')).toBe(epochDate)
      expect(run('(smart-time-parse "January 01, 2025")')).toBe(run('(smart-time-parse "January 1, 2025")'))
      expect(run('(smart-time-parse "Jan 31, 2025")')).toBe(epochDate)
      expect(run('(smart-time-parse "31 January 2025")')).toBe(epochDate)
      expect(run('(smart-time-parse "31 Jan 2025")')).toBe(epochDate)
      expect(run('(smart-time-parse "January 2025")')).toBe(epochMonth)
      expect(run('(smart-time-parse "Jan 2025")')).toBe(epochMonth)
    })
  })
})
