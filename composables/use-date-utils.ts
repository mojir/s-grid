import { fromZonedTime } from 'date-fns-tz'
import { isValid, parse, parseISO, type FPFn1, format } from 'date-fns/fp'
import { defaultDatePattern } from '~/lib/constants'

let timeZone = ref<TimeZone>(getLocalTimeZone())

const referenceDate = new Date()
const isoDateRegexp = new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}(:\d{2})?)$/)

type SmartTimeParser = {
  regexp: RegExp
  parse: FPFn1<Date, string>
  iso?: true
}

function smartParse(value: string, timeZone: TimeZone): Date | null {
  for (const parser of smartTimeParsers) {
    if (!parser.regexp.test(value)) {
      continue
    }
    const parsedDate = parser.parse(value)
    if (!isValid(parsedDate)) {
      return null
    }
    const result = parser.iso
      ? parsedDate
      : fromZonedTime(parsedDate, timeZone.id)

    if (isNaN(result.getTime())) {
      continue
    }
    return result
  }
  return null
}

type PatternDescription = {
  regexp: RegExp
  pattern: string
  example: string
}
const patternDescriptions: PatternDescription[] = [
  {
    regexp: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/,
    pattern: 'yyyy-MM-dd HH:mm:ss.SSS', // 2024-01-31 23:59:59.999
  },
  {
    regexp: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    pattern: 'yyyy-MM-dd HH:mm:ss', // 2024-01-31 23:59:59
  },
  {
    regexp: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
    pattern: 'yyyy-MM-dd HH:mm', // 2024-01-31 23:59
  },
  {
    regexp: /^\d{4}-\d{2}-\d{2}$/,
    pattern: 'yyyy-MM-dd', // 2024-01-31
  },
  {
    regexp: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    pattern: 'M/d/yyyy', // 01/31/2024
  },
  {
    regexp: /^\d{8}$/,
    pattern: 'yyyyMMdd', // 20240131
  },
  {
    regexp: /^(\w{3}) \d{1,2}, \d{4}$/,
    pattern: 'MMM d, yyyy', // Jan 31, 2024
  },
  {
    regexp: /^\w+ \d{1,2}, \d{4}$/,
    pattern: 'MMMM d, yyyy', // January 31, 2024
  },
  {
    regexp: /^\d{1,2} \w+ \d{4}$/,
    pattern: 'd MMMM yyyy', // 31 January 2024
  },
  {
    regexp: /^\d{1,2} (\w{3}) \d{4}$/,
    pattern: 'd MMM yyyy', // 31 Jan 2024
  },
  {
    regexp: /^(\w{3}) \d{4}$/,
    pattern: 'MMM yyyy', // Jan 2024
  },
  {
    regexp: /^\w+ \d{4}$/,
    pattern: 'MMMM yyyy', // January 2024
  },
  {
    regexp: /^\d{4}-\d{2}$/,
    pattern: 'yyyy-MM', // 2024-01 (will use first day of month)
  },
].map(({ regexp, pattern }) => ({ regexp, pattern, example: format(pattern, new Date('2025-01-31T15:45:15.666')) }))

const smartTimeParsers: Array<SmartTimeParser> = [
  {
    regexp: new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}(:\d{2})?)$/),
    parse: parseISO,
    iso: true,
  },

  ...patternDescriptions.map(formatInfo => ({
    regexp: formatInfo.regexp,
    parse: parse(referenceDate, formatInfo.pattern),
  }))]

export default function () {
  function setupRefs({
    timeZoneRef,
  }: {
    timeZoneRef: Ref<TimeZone>
  }) {
    timeZone = timeZoneRef
  }

  function normalizeToIsoDate(dateString: string): string | undefined {
    const date = smartParse(dateString, timeZone.value)
    if (date === null) {
      return
    }
    return date.toISOString()
  }

  function parseIsoDate(dateString: unknown): Date | undefined {
    if (typeof dateString !== 'string') {
      return
    }
    if (!isoDateRegexp.test(dateString)) {
      return
    }
    const date = parseISO(dateString)
    if (!isValid(date)) {
      return
    }
    if (isNaN(date.getTime())) {
      return
    }
    return date
  }

  function getPatternFromDateString(dateString: string): string | undefined {
    return patternDescriptions.find(formatInfo => formatInfo.regexp.test(dateString))?.pattern ?? defaultDatePattern
  }

  return {
    setupRefs,
    normalizeToIsoDate,
    parseIsoDate,
    getPatternFromDateString,
    patternDescriptions,
  }
}
