import type { Cell } from '~/lib/Cell'

export const useAlias = createSharedComposable(() => {
  const cellAliases = shallowRef(new Map<string, Cell>())

  function setAlias(alias: string, cell: Cell) {
    if (cellAliases.value.has(alias)) {
      throw new Error(`Alias ${alias} already exists`)
    }
    cell.alias.value = alias
    cellAliases.value.set(alias, cell)
  }

  function getAlias(alias: string): Cell | undefined {
    return cellAliases.value.get(alias)
  }

  return {
    setAlias,
    getAlias,
  }
})
