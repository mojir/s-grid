import type { JsFunction } from '@mojir/lits'
import { format as d3format } from 'd3-format'

const formatCache = new Map<string, ReturnType<typeof d3format>>()

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
