import type { Cell } from '~/lib/Cell'

export class GridAlias {
  private cellAliases = new Map<string, Cell>()
  private lookup = new WeakMap<Cell, string>()

  public setCell(alias: string, cell: Cell) {
    if (this.cellAliases.has(alias)) {
      throw new Error(`Alias ${alias} already exists`)
    }
    this.lookup.set(cell, alias)
    this.cellAliases.set(alias, cell)
  }

  public getCell(alias: string): Cell | undefined {
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
