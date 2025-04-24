import type { JsFunction } from '@mojir/lits'
import { prettyPi } from '@mojir/pretty-pi'

export const numberPrettyPi: JsFunction = {
  fn: (value: number, precision = 4) => {
    return prettyPi(value, { precision })
  },
}
