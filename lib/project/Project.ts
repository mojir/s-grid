import { Aliases } from '../Aliases'
import { builtinGrid } from '../builtinGrid'
import { defaultNumberOfCols, defaultNumberOfRows } from '../constants'
import { Grid } from '../grid/Grid'
import { getReferenceFromString } from '../reference/utils'
import { REPL } from '../REPL'
import { transformLitsPrograms } from '../transformer/litsTransformer'
import { getGridName } from '../utils'
import type { Cell } from '../Cell'
import type { Transformation } from '../transformer'
import { ProjectClipboard } from './ProjectClipboard'
import { History } from './History'
import { CommandCenter } from '~/lib/CommandCenter'
import type { GridDTO } from '~/dto/GridDTO'

export class Project {
  public readonly repl = new REPL(this)
  public readonly commandCenter = new CommandCenter(this)
  public readonly aliases = new Aliases(this)
  public readonly clipboard = new ProjectClipboard(this)
  public readonly currentGridIndex = ref(0)
  public readonly currentGrid: ComputedRef<Grid>
  public readonly history = new History(this)
  public grids: Ref<Grid[]>
  public visibleGrids: ComputedRef<Grid[]>

  constructor() {
    this.grids = shallowRef([
      new Grid(this, getGridName('Grid1'), defaultNumberOfRows, defaultNumberOfCols),
      Grid.fromDTO(this, builtinGrid),
    ])
    this.currentGrid = computed(() => {
      return this.grids.value[this.currentGridIndex.value]!
    })
    this.visibleGrids = computed(() => {
      const { debugMode } = useDebug()
      return this.grids.value
        .filter(grid => debugMode.value || !grid.hidden.value)
    })
    this.commandCenter.registerCommands()
    nextTick(() => this.history.start())
  }

  public importGrid(gridDTO: GridDTO) {
    const gridName = getGridName(gridDTO.name)
    const newGrid = Grid.fromDTO(this, gridDTO)

    const existingGridIndex = this.grids.value.findIndex(grid => grid.name.value === gridName)
    if (existingGridIndex >= 0) {
      this.grids.value = [
        ...this.grids.value.slice(0, existingGridIndex),
        newGrid,
        ...this.grids.value.slice(existingGridIndex + 1),
      ]
    }
    else {
      this.grids.value = [
        ...this.grids.value,
        newGrid,
      ]
    }
    this.selectGrid(newGrid)
  }

  public selectGrid(grid: Grid) {
    const index = this.grids.value.findIndex(g => g === grid)
    if (index < 0) {
      throw new Error(`Grid "${grid.name.value}" does not exist`)
    }
    this.currentGridIndex.value = index
  }

  public removeGrid(grid: Grid) {
    if (!this.grids.value.includes(grid)) {
      throw new Error(`Grid "${grid.name.value}" does not exist`)
    }
    this.transformAllReferences({
      type: 'gridDelete',
      grid,
    })
    this.grids.value = this.grids.value.filter(g => g !== grid)
    this.currentGridIndex.value = Math.max(this.currentGridIndex.value - 1, 0)
    let attempts = 0
    while (this.grids.value[this.currentGridIndex.value]?.hidden.value && attempts < this.grids.value.length) {
      this.currentGridIndex.value = (this.currentGridIndex.value + 1) % this.grids.value.length
      attempts += 1
    }
  }

  public renameGrid(grid: Grid, newName: string) {
    newName = getGridName(newName)
    grid.name.value = newName
    this.transformAllReferences({
      type: 'renameGrid',
      grid,
      newName,
    })
  }

  public addGrid() {
    let gridIndex = this.grids.value.filter(grid => !grid.hidden).length + 1
    let gridName = `Grid${gridIndex}`
    while (this.grids.value.find(grid => grid.name.value === getGridName(gridName))) {
      gridIndex += 1
      gridName = `Grid${gridIndex}`
    }

    this.grids.value = [
      ...this.grids.value, new Grid(this, gridName, defaultNumberOfRows, defaultNumberOfCols)]
  }

  public getValuesFromUndefinedIdentifiers(unresolvedIdentifiers: string[], grid: Grid) {
    return [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, value) => {
      const reference = getReferenceFromString(grid, value)
      if (reference) {
        acc[value] = reference.getOutput()
      }
      else {
        const aliasCell = this.aliases.getReference(value)
        if (aliasCell) {
          acc[value] = aliasCell.value.getOutput()
        }
      }

      return acc
    }, {})
  }

  public transformAllReferences(transformation: Transformation) {
    this.aliases.transformReferences(transformation)
    this.getAllCells().forEach((cell) => {
      transformLitsPrograms({ cell, transformation })
    })
  }

  public getGrid(gridName: string): Grid {
    const grid = this.grids.value.find(grid => grid.name.value === getGridName(gridName))
    if (!grid) {
      throw new Error(`Grid not found ${gridName}`)
    }
    return grid
  }

  public hasGrid(gridName: string): boolean {
    return !!this.grids.value.find(grid => grid.name.value === getGridName(gridName))
  }

  public getAllCells(): Cell[] {
    return this.grids.value.flatMap(grid => grid.getAllCells())
  }
}
