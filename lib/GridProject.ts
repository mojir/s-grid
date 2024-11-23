import { Grid } from './Grid'
import { getLocatorFromString } from './locator/Locator'
import { REPL } from './REPL'
import { CommandCenter } from '~/lib/CommandCenter'

type GridEntry = {
  name: string
  grid: Grid
}

export class GridProject {
  public commandCenter: CommandCenter
  public repl: REPL
  public readonly currentGrid: ComputedRef<Grid>

  public readonly gridIndex = ref(0)
  public grids: Ref<GridEntry[]>

  constructor() {
    this.repl = new REPL(this)
    this.commandCenter = new CommandCenter(this)

    this.grids = shallowRef([
      {
        name: 'Grid1',
        grid: new Grid(this, 'Grid1'),
      },
    ])
    this.currentGrid = computed(() => {
      return this.grids.value[this.gridIndex.value]!.grid
    })
  }

  public selectGrid(gridName: string) {
    const index = this.grids.value.findIndex(g => g.name === gridName)
    if (index < 0) {
      throw new Error(`Grid "${gridName}" does not exist`)
    }
    this.gridIndex.value = index
  }

  public removeGrid(gridName: string) {
    const index = this.grids.value.findIndex(g => g.name === gridName)
    if (index < 0) {
      throw new Error(`Grid "${gridName}" does not exist`)
    }
    this.grids.value = this.grids.value.filter((_, i) => i !== index)
    this.gridIndex.value = Math.max(this.gridIndex.value - 1, 0)
  }

  public addGrid() {
    let gridIndex = this.grids.value.length + 1
    let gridName = `Grid${gridIndex}`
    while (this.grids.value.find(g => g.name === gridName)) {
      gridIndex += 1
      gridName = `Grid${gridIndex}`
    }

    this.grids.value = [
      ...this.grids.value, {
        name: gridName,
        grid: new Grid(this, gridName),
      }]
  }

  public getValuesFromUndefinedIdentifiers(unresolvedIdentifiers: string[]) {
    return [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, value) => {
      const locator = getLocatorFromString(value)
      if (locator) {
        if (!locator.externalGrid) {
          acc[value] = this.currentGrid.value.getValueFromLocator(locator)
        }
        else {
          const grid = this.grids.value.find(g => g.name === locator.externalGrid)?.grid
          if (grid) {
            acc[value] = grid.getValueFromLocator(locator.withoutExternalGrid())
          }
          else {
            acc[value] = new Error(`Grid ${locator.externalGrid} does not exist`)
          }
        }
      }
      else {
        const aliasCell = this.currentGrid.value.alias.getCell(value)
        if (aliasCell) {
          acc[value] = aliasCell.output.value
        }
        else {
          acc[value] = new Error(`Invalid identifier: ${value}`)
        }
      }

      return acc
    }, {})
  }
}
