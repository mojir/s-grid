export function calculateNumberInput(input: Ref<string>): number | undefined {
  const num = Number(input.value.trim())
  return !isNaN(num) && isFinite(num) ? num : undefined
}
