import type { Cell } from './Cell'
import type { CellReference } from './reference/CellReference'
import type { Project } from './project/Project'
import type { FormulaTransformation } from './referenceTransformer'

export class Aliases {
  private cellAliases = new Map<string, Ref<CellReference>>()
  private lookup = new Map<string, Set<string>>()

  constructor(private project: Project) {}

  public setCell(alias: string, cellReference: CellReference, force = false) {
    const existingCell = this.cellAliases.get(alias)
    if (existingCell && !force) {
      throw new Error(`Alias ${alias} already exists`)
    }

    this.addLookup(cellReference, alias)
    const cellRef = shallowRef(cellReference)
    if (existingCell) {
      existingCell.value = cellReference
    }
    else {
      this.cellAliases.set(alias, cellRef)
    }
  }

  private addLookup(cellReference: CellReference, alias: string) {
    const existing = this.lookup.get(cellReference.toStringWithGrid())
    if (existing) {
      existing.add(alias)
    }
    else {
      this.lookup.set(cellReference.toStringWithGrid(), new Set([alias]))
    }
  }

  public getReference(alias: string): Ref<CellReference> | undefined {
    return this.cellAliases.get(alias)
  }

  public getAliases(cellReference: CellReference): string[] {
    const aliasSet = this.lookup.get(cellReference.toStringWithGrid())
    if (!aliasSet) {
      return []
    }
    else {
      return Array.from(aliasSet)
    }
  }

  public cellRemoved(cell: Cell) {
    const aliasSet = this.lookup.get(cell.cellReference.toStringWithGrid())
    if (!aliasSet) {
      return
    }
    console.log('aliasSet', aliasSet)
    aliasSet.forEach(alias => this.removeAlias(alias))
  }

  public removeAlias(alias: string) {
    const reference = this.cellAliases.get(alias)
    if (reference) {
      this.lookup.delete(reference.value.toStringWithGrid())
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

  public transformReferences(transformation: FormulaTransformation) {
    this.cellAliases
      .entries()
      .filter(([, reference]) => reference.value.grid === transformation.sourceGrid)
      .forEach(([alias, reference]) => {
        switch (transformation.type) {
          case 'gridDelete':
            this.cellAliases.delete(alias)
            this.lookup.delete(reference.value.toStringWithGrid())
            break
          case 'move':
            if (transformation.range && !transformation.range.containsCell(reference.value)) {
              return
            }
            reference.value = reference.value.move(transformation.movement)
            break
          case 'rowDelete':
            if (reference.value.row >= transformation.row && reference.value.row < transformation.row + transformation.count) {
              this.removeAlias(alias)
            }
            else if (reference.value.row >= transformation.row + transformation.count) {
              reference.value = reference.value.move({ deltaRow: -transformation.count, toGrid: transformation.sourceGrid })
            }
            break
          case 'rowInsertBefore':
            if (reference.value.row >= transformation.row + transformation.count) {
              reference.value = reference.value.move({ deltaRow: transformation.count, toGrid: transformation.sourceGrid })
            }
            break
          case 'colDelete':
            if (reference.value.col >= transformation.col && reference.value.col < transformation.col + transformation.count) {
              this.removeAlias(alias)
            }
            else if (reference.value.col >= transformation.col + transformation.count) {
              reference.value = reference.value.move({ deltaCol: -transformation.count, toGrid: transformation.sourceGrid })
            }
            break
          case 'colInsertBefore':
            if (reference.value.col >= transformation.col) {
              reference.value = reference.value.move({ deltaCol: transformation.count, toGrid: transformation.sourceGrid })
            }
            break
        }
      })
  }
}
