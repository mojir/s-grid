import { Aliases } from '../Aliases'
import { builtinGrid } from '../builtinGrid'
import { defaultNumberOfCols, defaultNumberOfRows } from '../constants'
import { Grid } from '../grid/Grid'
import { getReferenceLocatorFromString } from '../locators/utils'
import { matrixForEach } from '../matrix'
import { REPL } from '../REPL'
import { transformLocators, type FormulaTransformation } from '../transformLocators'
import { getGridName } from '../utils'
import { ProjectClipboard } from './ProjectClipboard'
import { Locator } from './Locator'
import { History } from './History'
import { CommandCenter } from '~/lib/CommandCenter'
import type { GridDTO } from '~/dto/GridDTO'

export class Project {
  public readonly repl = new REPL(this)
  public readonly commandCenter = new CommandCenter(this)
  public readonly aliases = new Aliases()
  public readonly clipboard = new ProjectClipboard(this)
  public readonly locator = new Locator(this)
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

  public importGrid(grid: GridDTO) {
    const gridName = getGridName(grid.name)
    const newGrid = Grid.fromDTO(this, grid)

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
    this.selectGrid(gridName)
  }

  public selectGrid(gridName: string) {
    const index = this.grids.value.findIndex(grid => grid.name.value === getGridName(gridName))
    if (index < 0) {
      throw new Error(`Grid "${gridName}" does not exist`)
    }
    this.currentGridIndex.value = index
  }

  public removeGrid(gridName: string) {
    const index = this.grids.value.findIndex(grid => grid.name.value === getGridName(gridName))
    if (index < 0) {
      throw new Error(`Grid "${gridName}" does not exist`)
    }
    this.grids.value = this.grids.value.filter((_, i) => i !== index)
    this.currentGridIndex.value = Math.max(this.currentGridIndex.value - 1, 0)
    let attempts = 0
    while (this.grids.value[this.currentGridIndex.value].hidden.value && attempts < this.grids.value.length) {
      this.currentGridIndex.value = (this.currentGridIndex.value + 1) % this.grids.value.length
      attempts += 1
    }
  }

  public renameGrid(oldName: string, newName: string) {
    oldName = getGridName(oldName)
    newName = getGridName(newName)
    const grid = this.grids.value.find(grid => grid.name.value === oldName)
    if (!grid) {
      throw new Error(`Grid "${oldName}" does not exist`)
    }
    grid.name.value = getGridName(newName)
    this.transformAllLocators({
      type: 'renameGrid',
      oldName,
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
      const locator = getReferenceLocatorFromString(grid, value)
      if (locator) {
        acc[value] = this.locator.getValueFromLocator(locator)
      }
      else {
        const aliasCell = this.aliases.getCell(value)
        if (aliasCell) {
          acc[value] = aliasCell.value.output.value
        }
      }

      return acc
    }, {})
  }

  public transformAllLocators(transformation: FormulaTransformation) {
    for (const grid of this.grids.value) {
      matrixForEach(grid.cells, (cell) => {
        transformLocators(cell, transformation)
      })
    }
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
}
