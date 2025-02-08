export type DerivedType = 'number' | 'date' | 'string' | 'unknown'

export type Result<T = unknown> = {
  result?: T
  error?: Error
}
