import type { Reference } from '../reference/utils'

export function calculateAllLitsDeps({
  references,
  directLitsDeps,
}:
{
  references: Ref<Reference[]>
  directLitsDeps: Ref<string[]>
}): string[] {
  const allLitsDeps = new Set<string>(directLitsDeps.value)

  references.value
    .flatMap(reference => reference.getCells())
    .flatMap(cell => cell.allLitsDeps.value)
    .forEach(identifier => allLitsDeps.add(identifier))

  return Array.from(allLitsDeps)
}
