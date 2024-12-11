import type { Grid } from '../grid/Grid'

export abstract class CommonLocator {
  readonly grid: Grid

  constructor(grid: Grid) {
    this.grid = grid
  }

  abstract toStringWithoutGrid(): string

  public toStringWithGrid(): string {
    return `${this.grid}!${this.toStringWithoutGrid()}`
  }

  public toString(currentGrid: Grid): string {
    return this.grid === currentGrid ? this.toStringWithoutGrid() : this.toStringWithGrid()
  }
}
