import type { Project } from './project/Project'
import type { Transformation } from './transformer'
import type { Reference } from './reference/utils'

export class Aliases {
  private referenceAliases = new Map<string, Ref<Reference>>()

  constructor(private project: Project) {}

  public setCell(alias: string, reference: Reference, force = false) {
    const existingCell = this.referenceAliases.get(alias)
    if (existingCell && !force) {
      throw new Error(`Alias ${alias} already exists`)
    }

    const referenceRef = shallowRef(reference)
    if (existingCell) {
      existingCell.value = reference
    }
    else {
      this.referenceAliases.set(alias, referenceRef)
    }
  }

  public getReference(alias: string): Ref<Reference> | undefined {
    return this.referenceAliases.get(alias)
  }

  public removeAlias(alias: string) {
    const reference = this.referenceAliases.get(alias)
    if (reference) {
      this.referenceAliases.delete(alias)
      console.log('delete', alias)
      if (alias) {
        const dependants = this.project.getAllCells().filter(cell => cell.localReferences.value.includes(alias))

        dependants.forEach((dependantCell) => {
          dependantCell.input.value = `=(throw "Reference to removed alias ${alias}"))`
        })
      }
    }
  }

  public transformReferences(transformation: Transformation) {
    this.referenceAliases
      .entries()
      .forEach(([alias, reference]) => {
        console.log('transform', transformation, alias, reference.value)
      })
  }
}
