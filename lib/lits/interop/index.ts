import type { JsFunction } from '@mojir/lits'
import { numberFormat } from './d3-lits'
import { numberPrettyPi } from './pretty-pi'
import { dateToIsoDate, getDateFormat, getDateParse } from './date-fns-lits'

export const interopFunctionNames = [
  'number:format',
  'number:symbolic',
  'date:parse',
  'date:format',
  'date:to-iso-date',
] as const

export type InteropFunctionName = typeof interopFunctionNames[number]

export function getInteropFunctions(timeZone: Ref<TimeZone>): Record<InteropFunctionName, JsFunction> {
  return {
    'number:format': numberFormat,
    'number:symbolic': numberPrettyPi,
    'date:parse': getDateParse(timeZone),
    'date:format': getDateFormat(timeZone),
    'date:to-iso-date': dateToIsoDate,
  }
}
