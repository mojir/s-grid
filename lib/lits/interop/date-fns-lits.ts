import type { JsFunction } from '@mojir/lits'
import { isValid, parse, type FPFn1 } from 'date-fns/fp'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

const referenceDate = new Date(0)
// const referenceDate = new Date(Date.UTC(1970))

const smartTimeParsers: Array<FPFn1<Date, string>> = [
  'yyyy-MM-dd HH:mm:ss.SSS', // 2024-01-31 23:59:59.999
  'yyyy-MM-dd HH:mm:ss', // 2024-01-31 23:59:59
  'yyyy-MM-dd HH:mm', // 2024-01-31 23:59
  'yyyy-MM-dd', // 2024-01-31
  'MM/dd/yyyy', // 01/31/2024
  'yyyyMMdd', // 20240131
  'MMMM dd, yyyy', // January 31, 2024
  'MMM dd, yyyy', // Jan 31, 2024
  'dd MMMM yyyy', // 31 January 2024
  'dd MMM yyyy', // 31 Jan 2024
  'MMMM yyyy', // January 2024
  'MMM yyyy', // Jan 2024
  'yyyy-MM', // 2024-01 (will use first day of month)
].map(formatString => parse(referenceDate, formatString))

const parseWithReferenceDate = parse(referenceDate)

export function getDateFnsParse(timeZone: Ref<string>): JsFunction {
  return {
    fn: (formatString: string, value: string) => {
      const parsedDate = parseWithReferenceDate(formatString, value)
      if (!isValid(parsedDate)) {
        return null
      }
      const result = fromZonedTime(parsedDate, timeZone.value).getTime()
      if (isNaN(result)) {
        return null
      }
      return result
    },
  }
}

export function getDateFnsSmartParse(timeZone: Ref<string>): JsFunction {
  return {
    fn: (value: string) => {
      for (const parser of smartTimeParsers) {
        const parsedDate = parser(value)
        if (!isValid(parsedDate)) {
          continue
        }
        const result = fromZonedTime(parsedDate, timeZone.value).getTime()
        if (isNaN(result)) {
          continue
        }
        return result
      }
      return null
    },
  }
}

export function getDateFnsFormat(timeZone: Ref<string>): JsFunction {
  return {
    fn: (formatString: string, value: number) => {
      const date = new Date(value)
      return formatInTimeZone(date, timeZone.value, formatString)
    },
  }
}
