import type { JsFunction } from '@mojir/lits'
import { format } from 'd3-format'

const formatCache = new Map<string, ReturnType<typeof format>>()

export const d3Format: JsFunction = {
  fn: (formatString: string, value: number) => {
    let formatter = formatCache.get(formatString)
    if (!formatter) {
      formatter = format(formatString)
      formatCache.set(formatString, formatter)
    }
    return formatter(value)
  },
}
