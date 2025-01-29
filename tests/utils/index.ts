import type { GridDTO } from '~/dto/GridDTO'
import type { ProjectDTO } from '~/dto/ProjectDTO'
import { Project } from '~/lib/project/Project'

type MockProjectOptions = {
  grid1?: Partial<GridDTO>
  grid2?: Partial<GridDTO>
  grid3?: Partial<GridDTO>
  currentGridIndex?: 0 | 1 | 2
  aliases?: ProjectDTO['aliases']
  minRows?: number
  minCols?: number
}

export function mockProject(options: MockProjectOptions = {}): Project {
  const minRows = options.minRows ?? 4
  const minCols = options.minCols ?? 4
  const { nbrOfRows, nbrOfCols } = [
    ...Object.keys(options.grid1?.cells ?? {}),
    ...Object.keys(options.grid2?.cells ?? {}),
    ...Object.keys(options.grid3?.cells ?? {})]
    .reduce((acc, key) => {
      const { rowIndex, colIndex } = getRowIndexAndColIndexFromSimpleCellReference(key)
      return {
        nbrOfRows: Math.max(acc.nbrOfRows, rowIndex + 1),
        nbrOfCols: Math.max(acc.nbrOfCols, colIndex + 1),
      }
    }, { nbrOfRows: minRows, nbrOfCols: minCols })

  const grid1: GridDTO = {
    cells: {},
    nbrOfRows,
    nbrOfCols,
    name: 'Grid1',
    ...options.grid1,
  }
  const grid2: GridDTO = {
    cells: {},
    nbrOfRows,
    nbrOfCols,
    name: 'Grid2',
    ...options.grid2,
  }
  const grid3: GridDTO = {
    cells: {},
    nbrOfRows,
    nbrOfCols,
    name: 'Grid3',
    ...options.grid3,
  }

  return new Project({
    grids: [grid1, grid2, grid3],
    currentGridIndex: options.currentGridIndex ?? 0,
    aliases: options.aliases ?? {},
  })
}
