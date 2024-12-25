import type { Grid } from '../grid/Grid'
import type { Reference } from './utils'

export abstract class BaseReference {
  readonly grid: Grid

  constructor(grid: Grid) {
    this.grid = grid
  }

  abstract toStringWithoutGrid(): string
  abstract equals(reference: Reference): boolean
  abstract getOutput(): unknown

  public toStringWithGrid(): string {
    return `${this.grid.name.value}!${this.toStringWithoutGrid()}`
  }

  public toString(currentGrid: Grid): string {
    return this.grid === currentGrid ? this.toStringWithoutGrid() : this.toStringWithGrid()
  }
}
