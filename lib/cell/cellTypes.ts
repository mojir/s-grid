export type DerivedType = 'number' | 'date' | 'string' | 'array' | 'vector' | 'grid' | 'matrix' | 'function' | 'null' | 'unknown'

export type Result<T = unknown> = {
  result?: T
  error?: Error
}
