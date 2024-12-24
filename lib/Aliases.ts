import type { Cell } from './Cell'
import type { CellLocator } from './locators/CellLocator'
import type { Project } from './project/Project'
import type { FormulaTransformation } from './transformLocators'

export class Aliases {
  private cellAliases = new Map<string, Ref<CellLocator>>()
  private lookup = new Map<string, Set<string>>()

  constructor(private project: Project) {}

  public setCell(alias: string, cellLocator: CellLocator, force = false) {
    const existingCell = this.cellAliases.get(alias)
    if (existingCell && !force) {
      throw new Error(`Alias ${alias} already exists`)
    }

    this.addLookup(cellLocator, alias)
    const cellRef = shallowRef(cellLocator)
    if (existingCell) {
      existingCell.value = cellLocator
    }
    else {
      this.cellAliases.set(alias, cellRef)
    }
  }

  private addLookup(cellLocator: CellLocator, alias: string) {
    const existing = this.lookup.get(cellLocator.toStringWithGrid())
    if (existing) {
      existing.add(alias)
    }
    else {
      this.lookup.set(cellLocator.toStringWithGrid(), new Set([alias]))
    }
  }

  public getLocator(alias: string): Ref<CellLocator> | undefined {
    return this.cellAliases.get(alias)
  }

  public getAliases(cellLocator: CellLocator): string[] {
    const aliasSet = this.lookup.get(cellLocator.toStringWithGrid())
    if (!aliasSet) {
      return []
    }
    else {
      return Array.from(aliasSet)
    }
  }

  public cellRemoved(cell: Cell) {
    const aliasSet = this.lookup.get(cell.cellLocator.toStringWithGrid())
    if (!aliasSet) {
      return
    }
    console.log('aliasSet', aliasSet)
    aliasSet.forEach(alias => this.removeAlias(alias))
  }

  public removeAlias(alias: string) {
    const cellLocator = this.cellAliases.get(alias)
    if (cellLocator) {
      this.lookup.delete(cellLocator.value.toStringWithGrid())
      this.cellAliases.delete(alias)
      console.log('delete', alias)
      if (alias) {
        const dependants = this.project.getAllCells().filter(cell => cell.localReferences.value.includes(alias))

        dependants.forEach((dependantCell) => {
          dependantCell.input.value = `=(throw "Reference to removed alias ${alias}"))`
        })
      }
    }
  }

  public transformLocators(transformation: FormulaTransformation) {
    this.cellAliases
      .entries()
      .filter(([, locator]) => locator.value.grid === transformation.sourceGrid)
      .forEach(([alias, locator]) => {
        switch (transformation.type) {
          case 'gridDelete':
            this.cellAliases.delete(alias)
            this.lookup.delete(locator.value.toStringWithGrid())
            break
          case 'move':
            if (transformation.range && !transformation.range.containsCell(locator.value)) {
              return
            }
            locator.value = locator.value.move(transformation.movement)
            break
          case 'rowDelete':
            if (transformation.rowRangeLocator.containsCell(locator.value)) {
              this.removeAlias(alias)
            }
            else if (locator.value.row > transformation.rowRangeLocator.end.row) {
              locator.value = locator.value.move({ deltaRow: -transformation.rowRangeLocator.nbrOfRows, toGrid: transformation.sourceGrid })
            }
            break
          case 'rowInsertBefore':
            if (locator.value.row >= transformation.rowRangeLocator.start.row) {
              locator.value = locator.value.move({ deltaRow: transformation.rowRangeLocator.nbrOfRows, toGrid: transformation.sourceGrid })
            }
            break
          case 'colDelete':
            if (transformation.colRangeLocator.containsCell(locator.value)) {
              this.removeAlias(alias)
            }
            else if (locator.value.col > transformation.colRangeLocator.end.col) {
              locator.value = locator.value.move({ deltaCol: -transformation.colRangeLocator.nbrOfCols, toGrid: transformation.sourceGrid })
            }
            break
          case 'colInsertBefore':
            if (locator.value.col >= transformation.colRangeLocator.start.col) {
              locator.value = locator.value.move({ deltaCol: transformation.colRangeLocator.nbrOfCols, toGrid: transformation.sourceGrid })
            }
            break
        }
      })
  }
}
