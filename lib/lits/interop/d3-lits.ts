import type { JsFunction } from '@mojir/lits'
import { format } from 'd3-format'

const formatCache = new Map<string, ReturnType<typeof format>>()

export const numberFormat: JsFunction = {
  fn: (value: number, formatString: string) => {
    let formatter = formatCache.get(formatString)
    if (!formatter) {
      formatter = format(formatString)
      formatCache.set(formatString, formatter)
    }
    return formatter(value)
  },
}
