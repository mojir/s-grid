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

  public getValuesFromUndefinedIdentifiers(unresolvedIdentifiers: string[], grid: Grid) {
    return [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, value) => {
      const locator = getLocatorFromString(value)
      if (locator) {
        acc[value] = this.getValueFromLocator(locator)
      }
      else {
        const aliasCell = grid.alias.getCell(value)
        if (aliasCell) {
          acc[value] = aliasCell.output.value
        }
      }

      return acc
    }, {})
  }

  public getValueFromLocator(locator: Locator): unknown {
    const grid = this.getGridFromLocator(locator)
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
        transformLocators(gridEntry.grid, cell, transformation)
      })
    }
  }

  public getGridFromLocator(locator: Locator): Grid {
    if (!locator.externalGrid) {
      return this.currentGrid.value
    }
    const grid = this.grids.value.find(g => g.name === locator.externalGrid)?.grid
    if (!grid) {
      throw new Error(`Grid not found ${locator.toString()}`)
    }
    return grid
  }

  public getCellFromLocator(cellLocator: CellLocator): Cell {
    const grid = this.getGridFromLocator(cellLocator)
    const cell = grid.cells[cellLocator.row][cellLocator.col]
    if (!cell) {
      throw new Error(`Cell ${cellLocator.toString()} is out of range`)
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
                  externalGrid: null,
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
                  externalGrid: null,
                  absCol: false,
                  col: locator.col,
                }),
              ]

    return colLocators.map(colLocator => grid.cols.value[colLocator.col])
  }
}
