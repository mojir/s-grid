import type { JsFunction } from '@mojir/lits'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { isValid, parse } from 'date-fns/fp'

const parseWithReferenceDate = parse(new Date())

export function getDateParse(timeZone: Ref<TimeZone>): JsFunction {
  return {
    fn: (formatString: string, value: string) => {
      const parsedDate = parseWithReferenceDate(formatString, value)
      if (!isValid(parsedDate)) {
        return null
      }
      const result = fromZonedTime(parsedDate, timeZone.value.id).getTime()
      if (isNaN(result)) {
        return null
      }
      return result
    },
  }
}

export function getDateFormat(timeZone: Ref<TimeZone>): JsFunction {
  return {
    fn: (formatString: string, value: number) => {
      const date = new Date(value)
      return formatInTimeZone(date, timeZone.value.id, formatString)
    },
  }
}

export const dateToIsoDate: JsFunction = { fn: (value: number) => new Date(value).toISOString() }
