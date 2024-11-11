import type { Cell } from '~/lib/Cell'

export const useAlias = createSharedComposable(() => {
  const cellAliases = shallowRef(new Map<string, Cell>())
  const lookup = shallowRef(new WeakMap<Cell, string>())

  function setCell(alias: string, cell: Cell) {
    if (cellAliases.value.has(alias)) {
      throw new Error(`Alias ${alias} already exists`)
    }
    lookup.value.set(cell, alias)
    cellAliases.value.set(alias, cell)
  }

  function getCell(alias: string): Cell | undefined {
    return cellAliases.value.get(alias)
  }

  function getAlias(cell: Cell): string | undefined {
    return lookup.value.get(cell)
  }

  return {
    setCell,
    getCell,
    getAlias,
  }
})

export type AliasComposable = ReturnType<typeof useAlias>
