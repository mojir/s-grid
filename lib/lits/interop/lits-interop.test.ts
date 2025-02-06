import { describe, expect, it } from 'vitest'
import { d3Format } from './d3-lits'
import { getDateFnsFormat, getDateFnsParse, getDateFnsSmartParse } from './date-fns-lits'

const epochMillis = new Date('2025-01-31T12:34:56.789Z').valueOf()
const epochSec = new Date('2025-01-31T12:34:56.000Z').valueOf()
const epochMin = new Date('2025-01-31T12:34:00.000Z').valueOf()
const epochDate = new Date('2025-01-31T00:00:00.000Z').valueOf()
const epochMonth = new Date('2025-01-01T00:00:00.000Z').valueOf()

const utcTimeZoneRef = ref(timeZoneRecord['Europe/London'])
const cetTimeZoneRef = ref(timeZoneRecord['Europe/Paris'])
describe('lits-interop', () => {
  describe('d3', () => {
    describe('format', () => {
      it('should format numbers', () => {
        expect(d3Format.fn('0.2f', 123.456)).toBe('123.46')
      })
    })
  })
  describe('date-fns', () => {
    describe('parse', () => {
      it('should parse dates', () => {
        expect(getDateFnsParse(utcTimeZoneRef).fn('yyyy-MM-dd', '2025-01-31')).toBe(epochDate)
        expect(getDateFnsParse(utcTimeZoneRef).fn('yyyy-MM-dd HH:mm', '2025-01-31 12:34')).toBe(epochMin)
      })
      it('should return different for CET', () => {
        const result = getDateFnsParse(cetTimeZoneRef).fn('yyyy-MM-dd', '2025-01-31')
        expect(result).toBe(epochDate - 3600000)
      })
    })

    describe('format', () => {
      it('should format dates', () => {
        expect(getDateFnsFormat(utcTimeZoneRef).fn('yyyy-MM-dd', epochMillis)).toBe('2025-01-31')
        expect(getDateFnsFormat(utcTimeZoneRef).fn('yyyy-MM-dd HH:mm', epochMillis)).toBe('2025-01-31 12:34')
      })
      it('should return different for CET', () => {
        const cetResult = getDateFnsFormat(cetTimeZoneRef).fn('yyyy-MM-dd HH:mm', epochMillis)
        expect(cetResult).toBe('2025-01-31 13:34')
      })
    })

    // Intl.DateTimeFormat().resolvedOptions().timeZone
    describe('smart-parse', () => {
      it('should smart parse dates', () => {
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('2025-01-31 12:34:56.789')).toBe(epochMillis)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('2025-01-31 12:34:56')).toBe(epochSec)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('2025-01-31 12:34')).toBe(epochMin)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('2025-01-31')).toBe(epochDate)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('01/31/2025')).toBe(epochDate)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('20250131')).toBe(epochDate)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('2025-01')).toBe(epochMonth)

        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('January 31, 2025')).toBe(epochDate)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('January 01, 2025')).toBe(getDateFnsSmartParse(utcTimeZoneRef).fn('January 1, 2025'))
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('Jan 31, 2025')).toBe(epochDate)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('31 January 2025')).toBe(epochDate)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('31 Jan 2025')).toBe(epochDate)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('January 2025')).toBe(epochMonth)
        expect(getDateFnsSmartParse(utcTimeZoneRef).fn('Jan 2025')).toBe(epochMonth)
      })
    })
  })
})
