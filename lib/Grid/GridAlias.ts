import type { Cell } from '~/lib/Cell'

export class GridAlias {
  private cellAliases = new Map<string, Ref<Cell>>()
  private lookup = new WeakMap<Cell, string>()

  public setCell(alias: string, cell: Cell, force = false) {
    const existingCell = this.cellAliases.get(alias)
    if (existingCell && !force) {
      throw new Error(`Alias ${alias} already exists`)
    }

    this.lookup.set(cell, alias)
    const cellRef = shallowRef(cell)
    if (existingCell) {
      existingCell.value = cell
    }
    else {
      this.cellAliases.set(alias, cellRef)
    }
  }

  public getCell(alias: string): Ref<Cell> | undefined {
    return this.cellAliases.get(alias)
  }

  public getAlias(cell: Cell): string | undefined {
    return this.lookup.get(cell)
  }

  public cellRemoved(cell: Cell): string | undefined {
    const aliasString = this.lookup.get(cell)
    if (!aliasString) {
      return
    }
    this.cellAliases.delete(aliasString)
    this.lookup.delete(cell)
    return aliasString
  }
}
