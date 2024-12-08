export abstract class CommonLocator {
  readonly gridName: string

  constructor(gridName: string) {
    this.gridName = gridName
  }
  abstract toString(currentGridName: string): string
  abstract toStringWithoutGrid(): string
  abstract toStringWithGrid(): string
}
