import type { JsFunction } from '@mojir/lits'
import { isValid, parse, parseISO, type FPFn1 } from 'date-fns/fp'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

const referenceDate = new Date()

type SmartTimeParser = {
  regexp: RegExp
  parse: FPFn1<Date, string>
  iso?: true
}

const smartTimeParsers: Array<SmartTimeParser> = [
  {
    regexp: new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}(:\d{2})?)$/),
    parse: parseISO,
    iso: true,
  },

  ...[
    {
      pattern: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/,
      parseString: 'yyyy-MM-dd HH:mm:ss.SSS', // 2024-01-31 23:59:59.999
    },
    {
      pattern: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      parseString: 'yyyy-MM-dd HH:mm:ss', // 2024-01-31 23:59:59
    },
    {
      pattern: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
      parseString: 'yyyy-MM-dd HH:mm', // 2024-01-31 23:59
    },
    {
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      parseString: 'yyyy-MM-dd', // 2024-01-31
    },
    {
      pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      parseString: 'M/d/yyyy', // 01/31/2024
    },
    {
      pattern: /^\d{8}$/,
      parseString: 'yyyyMMdd', // 20240131
    },
    {
      pattern: /^(\w{3}) \d{1,2}, \d{4}$/,
      parseString: 'MMM d, yyyy', // Jan 31, 2024
    },
    {
      pattern: /^\w+ \d{1,2}, \d{4}$/,
      parseString: 'MMMM d, yyyy', // January 31, 2024
    },
    {
      pattern: /^\d{1,2} \w+ \d{4}$/,
      parseString: 'd MMMM yyyy', // 31 January 2024
    },
    {
      pattern: /^\d{1,2} (\w{3}) \d{4}$/,
      parseString: 'd MMM yyyy', // 31 Jan 2024
    },
    {
      pattern: /^(\w{3}) \d{4}$/,
      parseString: 'MMM yyyy', // Jan 2024
    },
    {
      pattern: /^\w+ \d{4}$/,
      parseString: 'MMMM yyyy', // January 2024
    },
    {
      pattern: /^\d{4}-\d{2}$/,
      parseString: 'yyyy-MM', // 2024-01 (will use first day of month)
    },
  ].map(formatInfo => ({
    regexp: new RegExp(formatInfo.pattern),
    parse: parse(referenceDate, formatInfo.parseString),
  }))]

const parseWithReferenceDate = parse(referenceDate)

export function getDateFnsParse(timeZone: Ref<TimeZone>): JsFunction {
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

export function getDateFnsSmartParse(timeZone: Ref<TimeZone>): JsFunction {
  return {
    fn: (value: string) => {
      for (const parser of smartTimeParsers) {
        if (!parser.regexp.test(value)) {
          continue
        }
        const parsedDate = parser.parse(value)
        if (!isValid(parsedDate)) {
          return null
        }
        const result = parser.iso
          ? parsedDate.getTime()
          : fromZonedTime(parsedDate, timeZone.value.id).getTime()

        if (isNaN(result)) {
          continue
        }
        return result
      }
      return null
    },
  }
}

export function getDateFnsFormat(timeZone: Ref<TimeZone>): JsFunction {
  return {
    fn: (formatString: string, value: number) => {
      const date = new Date(value)
      return formatInTimeZone(date, timeZone.value.id, formatString)
    },
  }
}
