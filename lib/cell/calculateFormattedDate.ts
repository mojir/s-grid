import { isLitsFunction } from '@mojir/lits'
import type { DerivedType, Result } from './cellTypes'

export function calculateFormattedDate({
  isoDate,
  dateFormatter,
  derivedType,
  run,
  apply,
}:
{
  isoDate: Ref<Date | undefined>
  dateFormatter: Ref<string>
  derivedType: Ref<DerivedType>
  run: RunLits
  apply: ApplyLits
}): Result<string> {
  if (isoDate.value && derivedType.value === 'date') {
    const formattedDate = formatDate({
      isoDate: isoDate.value,
      dateFormatter: dateFormatter.value,
      run,
      apply,
    })
    return formattedDate instanceof Error
      ? { error: formattedDate }
      : { result: formattedDate }
  }
  return {}
}

function formatDate({
  isoDate,
  dateFormatter,
  run,
  apply,
}:
{
  dateFormatter: string
  isoDate: Date
  run: RunLits
  apply: ApplyLits
}): string | Error {
  try {
    // const values = this.project.getValuesFromUndefinedIdentifiers(uniqueIdentifiers, this.grid)
    const fn = run(dateFormatter)

    if (!isLitsFunction(fn)) {
      return new Error('Invalid date formatter')
    }
    const result = apply(fn, [isoDate.getTime()])
    if (typeof result === 'string') {
      return result
    }
    return new Error('Invalid date formatter')
  }
  catch (error) {
    return error instanceof Error ? error : new Error('Unknown error')
  }
}
