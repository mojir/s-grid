import type { CellLocator } from './locators/CellLocator'
import type { FormulaTransformation } from './transformLocators'

export class Aliases {
  private cellAliases = new Map<string, Ref<CellLocator>>()
  private lookup = new Map<string, string>()

  public setCell(alias: string, cellLocator: CellLocator, force = false) {
    const existingCell = this.cellAliases.get(alias)
    if (existingCell && !force) {
      throw new Error(`Alias ${alias} already exists`)
    }

    this.lookup.set(cellLocator.toStringWithGrid(), alias)
    const cellRef = shallowRef(cellLocator)
    if (existingCell) {
      existingCell.value = cellLocator
    }
    else {
      this.cellAliases.set(alias, cellRef)
    }
  }

  public getLocator(alias: string): Ref<CellLocator> | undefined {
    return this.cellAliases.get(alias)
  }

  public getAlias(cellLocator: CellLocator): string | undefined {
    return this.lookup.get(cellLocator.toStringWithGrid())
  }

  public cellRemoved(cellLocator: CellLocator): string | undefined {
    const aliasString = this.lookup.get(cellLocator.toStringWithGrid())
    if (!aliasString) {
      return
    }
    this.cellAliases.delete(aliasString)
    this.lookup.delete(cellLocator.toStringWithGrid())
    return aliasString
  }

  public transformAllLocators(transformation: FormulaTransformation) {
    this.cellAliases
      .values()
      .filter(alias => alias.value.grid === transformation.sourceGrid)
      .forEach((locator) => {
        switch (transformation.type) {
          case 'move':
            console.log(locator)
        }
      })
  }
}
