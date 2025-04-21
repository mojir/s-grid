import type { SpillValue } from '../grid/SpillHandler'

export function calculateOutput({
  internalOutput,
  spillValue,
}: {
  internalOutput: Ref<unknown>
  spillValue: Ref<SpillValue | null>
}): unknown {
  return spillValue.value?.value ?? internalOutput.value
}
