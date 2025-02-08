import type { Result } from './cellTypes'

export function calculateOutput({
  input,
  numberInput,
  formulaResult,
}: {
  input: Ref<string>
  numberInput: Ref<number | undefined>
  formulaResult: Ref<Result>
}): unknown {
  if (input.value === '') {
    return null
  }

  if (input.value.startsWith('\'')) {
    return input.value.slice(1)
  }

  if (numberInput.value !== undefined) {
    return numberInput.value
  }

  if (formulaResult.value.result !== undefined) {
    return formulaResult.value.result
  }

  return input.value
}
