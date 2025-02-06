import type { JsFunction } from '@mojir/lits'
import { format } from 'd3-format'

const formatCache = new Map<string, ReturnType<typeof format>>()

export const d3Format: JsFunction = {
  fn: (formatString: string, value: number) => {
    let numberFormatter = formatCache.get(formatString)
    if (!numberFormatter) {
      numberFormatter = format(formatString)
      formatCache.set(formatString, numberFormatter)
    }
    return numberFormatter(value)
  },
}
