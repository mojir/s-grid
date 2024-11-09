import type { LitsParams } from '@mojir/lits'

export type JsFunctions = NonNullable<LitsParams['jsFunctions']>
export type JsFunction = JsFunctions[keyof JsFunctions]
