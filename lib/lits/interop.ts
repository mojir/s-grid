import type { JsFunction } from '@mojir/lits'
import { format as d3format } from 'd3-format'
import { timeFormat as d3TimeFormat, timeParse as d3TimeParse } from 'd3-time-format'

const formatCache = new Map<string, ReturnType<typeof d3format>>()
const timeFormatCache = new Map<string, ReturnType<typeof d3TimeFormat>>()
const timeParseCache = new Map<string, ReturnType<typeof d3TimeParse>>()

const smartTimeParsers: Array<ReturnType<typeof d3TimeParse>> = [
  '%Y-%m-%d %H:%M:%S.%L', // 2024-01-31 23:59:59.999
  '%Y-%m-%d %H:%M:%S', // 2024-01-31 23:59:59
  '%Y-%m-%d %H:%M', // 2024-01-31 23:59
  '%Y-%m-%d', // 2024-01-31
  '%m/%d/%Y', // 01/31/2024
  '%Y%m%d', // 20240131
  '%B %d, %Y', // January 31, 2024
  '%b %d, %Y', // Jan 31, 2024
  '%d %B %Y', // 31 January 2024
  '%d %b %Y', // 31 Jan 2024
  '%B %Y', // Januari 2024
  '%b %Y', // Jan 2024
  '%Y-%m', // 2024-01 (will use first day of month)
].map(d3TimeParse)

export const format: JsFunction = {
  fn: (formatString: string, value: number) => {
    let formatter = formatCache.get(formatString)
    if (!formatter) {
      formatter = d3format(formatString)
      formatCache.set(formatString, formatter)
    }
    return formatter(value)
  },
}

export const timeFormat: JsFunction = {
  fn: (formatString: string, epoch: number) => {
    let formatter = timeFormatCache.get(formatString)
    if (!formatter) {
      formatter = d3TimeFormat(formatString)
      timeFormatCache.set(formatString, formatter)
    }
    return formatter(new Date(epoch))
  },
}

export const timeParse: JsFunction = {
  fn: (formatString: string, value: string) => {
    let parser = timeParseCache.get(formatString)
    if (!parser) {
      parser = d3TimeParse(formatString)
      timeParseCache.set(formatString, parser)
    }
    return parser(value)?.valueOf()
  },
}

export const smartTimeParse: JsFunction = {
  fn: (value: string) => {
    for (const parser of smartTimeParsers) {
      const result = parser(value)
      if (result) {
        return result.valueOf()
      }
    }
    return null
  },
}
