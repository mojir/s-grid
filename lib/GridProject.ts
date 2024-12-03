import { ProjectClipboard } from './ProjectClipboard'
import type { Cell } from './Cell'
import type { Col } from './Col'
import { Grid } from './Grid'
import { CellLocator } from './locator/CellLocator'
import { ColLocator } from './locator/ColLocator'
import { ColRangeLocator } from './locator/ColRangeLocator'
import { getLocatorFromString, type Locator } from './locator/Locator'
import { RangeLocator } from './locator/RangeLocator'
import { RowLocator } from './locator/RowLocator'
import { RowRangeLocator } from './locator/RowRangeLocator'
import { matrixForEach, matrixMap } from './matrix'
import { REPL } from './REPL'
import type { Row } from './Row'
import { transformLocators, type FormulaTransformation } from './transformFormula'
import { getGridName } from './utils'
import { defaultNumberOfCols, defaultNumberOfRows } from './constants'
import { Aliases } from './Aliases'
import { builtinGrid } from './builtinGrid'
import { CommandCenter } from '~/lib/CommandCenter'
import type { GridDTO } from '~/dto/GridDTO'

type GridEntry = {
  name: string
  grid: Grid
}

export class GridProject {
  public readonly commandCenter = new CommandCenter(this)
  public readonly repl = new REPL(this)
  public readonly aliases = new Aliases()
  public readonly clipboard = new ProjectClipboard(this)
  public readonly currentGridIndex = ref(0)
  public readonly currentGrid: ComputedRef<Grid>
  public grids: Ref<GridEntry[]>
  public visibleGrids: ComputedRef<Grid[]>

  constructor() {
    this.grids = shallowRef([
      {
        name: 'Grid1',
        grid: new Grid(this, 'Grid1', defaultNumberOfRows, defaultNumberOfCols),
      },
      {
        name: builtinGrid.name,
        grid: Grid.fromDTO(this, builtinGrid),
      },
    ])
    this.currentGrid = computed(() => {
      return this.grids.value[this.currentGridIndex.value]!.grid
    })
    this.visibleGrids = computed(() => {
      const { debugMode } = useDebug()
      return this.grids.value
        .map(entry => entry.grid)
        .filter(g => debugMode.value || !g.hidden.value)
    })
  }

  public importGrid(grid: GridDTO) {
    const gridName = getGridName(grid.name)
    const newGridEntry: GridEntry = {
      name: gridName,
      grid: Grid.fromDTO(this, grid),
    }
    const existingGridIndex = this.grids.value.findIndex(g => g.name === gridName)
    if (existingGridIndex >= 0) {
      this.grids.value = [
        ...this.grids.value.slice(0, existingGridIndex),
        newGridEntry,
        ...this.grids.value.slice(existingGridIndex + 1),
      ]
    }
    else {
      this.grids.value = [
        ...this.grids.value,
        newGridEntry,
      ]
    }
    this.selectGrid(gridName)
  }

  public selectGrid(gridName: string) {
    const index = this.grids.value.findIndex(g => g.name === gridName)
    if (index < 0) {
      throw new Error(`Grid "${gridName}" does not exist`)
    }
    this.currentGridIndex.value = index
  }

  public removeGrid(gridName: string) {
    const index = this.grids.value.findIndex(g => g.name === gridName)
    if (index < 0) {
      throw new Error(`Grid "${gridName}" does not exist`)
    }
    this.grids.value = this.grids.value.filter((_, i) => i !== index)
    this.currentGridIndex.value = Math.max(this.currentGridIndex.value - 1, 0)
    let attempts = 0
    while (this.grids.value[this.currentGridIndex.value].grid.hidden.value && attempts < this.grids.value.length) {
      this.currentGridIndex.value = (this.currentGridIndex.value + 1) % this.grids.value.length
      attempts += 1
    }
  }

  public addGrid() {
    let gridIndex = this.grids.value.filter(g => !g.grid.hidden).length + 1
    let gridName = `Grid${gridIndex}`
    while (this.grids.value.find(g => g.name === gridName)) {
      gridIndex += 1
      gridName = `Grid${gridIndex}`
    }

    this.grids.value = [
      ...this.grids.value, {
        name: gridName,
        grid: new Grid(this, gridName, defaultNumberOfRows, defaultNumberOfCols),
      }]
  }

  public getValuesFromUndefinedIdentifiers(unresolvedIdentifiers: string[], grid: Grid) {
    return [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, value) => {
      const locator = getLocatorFromString(grid.name.value, value)
      if (locator) {
        acc[value] = this.getValueFromLocator(grid, locator)
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

  public getValueFromLocator(grid: Grid, locator: Locator): unknown {
    if (locator instanceof RangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof RowLocator) {
      return locator
        .getAllCellLocators(grid.cols.value.length)
        .map(cellLocator => this.getCellFromLocator(cellLocator).output.value)
    }
    else if (locator instanceof ColLocator) {
      return locator
        .getAllCellLocators(grid.rows.value.length)
        .map(cellLocator => this.getCellFromLocator(cellLocator).output.value)
    }
    else if (locator instanceof RowRangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(grid.cols.value.length),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof ColRangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(grid.rows.value.length),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof CellLocator) {
      return this.getCellFromLocator(locator).output.value
    }
  }

  public transformAllLocators(transformation: FormulaTransformation) {
    for (const gridEntry of this.grids.value) {
      matrixForEach(gridEntry.grid.cells, (cell) => {
        transformLocators(cell, transformation)
      })
    }
  }

  public getGridFromLocator(locator: Locator): Grid {
    if (!locator.gridName) {
      return this.currentGrid.value
    }
    const grid = this.grids.value.find(g => g.name === locator.gridName)?.grid
    if (!grid) {
      throw new Error(`Grid not found ${locator.toStringWithGrid()}`)
    }
    return grid
  }

  public getCellFromLocator(cellLocator: CellLocator): Cell {
    const grid = this.getGridFromLocator(cellLocator)
    const cell = grid.cells[cellLocator.row][cellLocator.col]
    if (!cell) {
      throw new Error(`Cell ${cellLocator.toStringWithGrid()} is out of range`)
    }

    return cell
  }

  public getCellsFromLocator(locator: Locator): Cell[] {
    const grid = this.getGridFromLocator(locator)
    return locator instanceof RangeLocator
      ? locator.getAllCellLocators().map(cellLocator => this.getCellFromLocator(cellLocator))
      : locator instanceof RowLocator
        ? locator.getAllCellLocators(grid.cols.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
        : locator instanceof ColLocator
          ? locator.getAllCellLocators(grid.rows.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
          : locator instanceof RowRangeLocator
            ? locator.getAllCellLocators(grid.cols.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
            : locator instanceof ColRangeLocator
              ? locator.getAllCellLocators(grid.rows.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
              : [this.getCellFromLocator(locator)]
  }

  public getRowsFromLocator(locator: Locator): Row[] {
    const grid = this.getGridFromLocator(locator)
    const rowLocators: RowLocator[] = locator instanceof RangeLocator
      ? locator.getAllRowLocators()
      : locator instanceof RowLocator
        ? [locator]
        : locator instanceof ColLocator || locator instanceof ColRangeLocator
          ? grid.gridRange.value.getAllRowLocators()
          : locator instanceof RowRangeLocator
            ? locator.getAllRowLocators()
            : [
                new RowLocator({
                  gridName: locator.gridName,
                  absRow: false,
                  row: locator.row,
                }),
              ]

    return rowLocators.map(rowLocator => grid.rows.value[rowLocator.row])
  }

  public getColsFromLocator(locator: Locator): Col[] {
    const grid = this.getGridFromLocator(locator)
    const colLocators: ColLocator[] = locator instanceof RangeLocator
      ? locator.getAllColLocators()
      : locator instanceof ColLocator
        ? [locator]
        : locator instanceof RowLocator || locator instanceof RowRangeLocator
          ? grid.gridRange.value.getAllColLocators()
          : locator instanceof ColRangeLocator
            ? locator.getAllColLocators()
            : [
                new ColLocator({
                  gridName: locator.gridName,
                  absCol: false,
                  col: locator.col,
                }),
              ]

    return colLocators.map(colLocator => grid.cols.value[colLocator.col])
  }
}
