import type { Project } from './project/Project'
import type { ReferenceTransformation } from './transformer'
import { getReferenceFromStringWithGrid, isReferenceString, type Reference } from './reference/utils'
import { transformReference } from './transformer/referenceTransformer'

const aliasNameRegexp = /^[A-Z][a-zA-Z0-9_-]*$/

export function isAliasName(alias: string): boolean {
  if (isReferenceString(alias)) {
    return false
  }
  return aliasNameRegexp.test(alias)
}
export class Aliases {
  public aliases = shallowRef<Record<string, Ref<Reference>>>({})

  constructor(private project: Project, aliases: Record<string, string>) {
    Object.entries(aliases).forEach(([alias, referenceString]) => {
      const reference = getReferenceFromStringWithGrid(project, referenceString)
      this.setAlias(alias, reference)
    })
  }

  public setAlias(alias: string, reference: Reference) {
    if (!isAliasName(alias)) {
      throw new Error(`Invalid alias name: ${alias}`)
    }
    const existingCell = this.aliases.value[alias]

    const referenceRef = shallowRef(reference)
    if (existingCell) {
      existingCell.value = reference
    }
    else {
      this.aliases.value = {
        ...this.aliases.value,
        [alias]: referenceRef,
      }
    }
  }

  public editAlias(alias: string, { newAlias, newReference }: { newAlias: string, newReference: Reference }) {
    if (!isAliasName(alias)) {
      throw new Error(`Invalid alias name: ${alias}`)
    }

    const reference = this.aliases.value[alias]
    if (!reference) {
      throw new Error(`Alias ${alias} does not exist`)
    }

    this.setAlias(newAlias, newReference)

    this.project.transformAllReferences({
      type: 'renameIdentifier',
      oldIdentifier: alias,
      newIdentifier: newAlias,
    })

    if (alias !== newAlias) {
      this.removeAlias(alias)
    }
  }

  public getReference(alias: string): Ref<Reference> | undefined {
    return this.aliases.value[alias]
  }

  public removeAlias(alias: string) {
    if (!isAliasName(alias)) {
      throw new Error(`Invalid alias name: ${alias}`)
    }

    const reference = this.aliases.value[alias]
    if (reference) {
      this.aliases.value = Object.entries(this.aliases.value)
        .filter(([a]) => a !== alias)
        .reduce((acc: Record<string, Ref<Reference>>, [a, reference]) => {
          acc[a] = reference
          return acc
        }, {})

      const dependants = this.project.getAllCells().filter(cell => cell.localReferences.value.includes(alias))

      dependants.forEach((dependantCell) => {
        dependantCell.input.value = `=(throw "Alias removed: ${alias}")`
      })
    }
  }

  public transformReferences(transformation: ReferenceTransformation) {
    Object.entries(this.aliases.value)
      .filter(([_, reference]) => reference.value.grid === transformation.grid)
      .forEach(([alias, reference]) => {
        try {
          reference.value = transformReference(reference.value, transformation)
        }
        catch {
          this.removeAlias(alias)
        }
      })
  }
}
