import type { Locator } from './Locator'

export abstract class CommonLocator {
  readonly externalGrid: string | null

  constructor(externalGrid: string | null) {
    this.externalGrid = externalGrid
  }
  abstract toString(): string
  abstract withoutExternalGrid(): Locator
  abstract withExternalGrid(externalGrid: string): Locator
}
