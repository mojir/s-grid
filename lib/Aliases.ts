import type { Project } from './project/Project'
import type { ReferenceTransformation } from './transformer'
import { getReferenceFromStringWithGrid, isReferenceString, type Reference } from './reference/utils'
import { transformReference } from './transformer/referenceTransformer'
import { CellReference } from './reference/CellReference'
import type { AliasesDTO } from '~/dto/AliasesDTO'

const aliasNameRegexp = /^[A-Z][a-zA-Z0-9_-]*$/

export function isAliasName(alias: string): boolean {
  if (isReferenceString(alias)) {
    return false
  }
  return aliasNameRegexp.test(alias)
}
export class Aliases {
  public readonly aliases = shallowRef<Record<string, Ref<Reference>>>({})
  public readonly reverseAliases = computed(() => {
    return Object.entries(this.aliases.value).reduce((acc: Record<string, string>, [alias, reference]) => {
      const referenceString = reference.value.toStringWithGrid()
      if (referenceString) {
        acc[referenceString] = alias
      }
      return acc
    }, {})
  })

  constructor(private project: Project, aliases: Record<string, string>) {
    Object.entries(aliases).forEach(([alias, referenceString]) => {
      const reference = getReferenceFromStringWithGrid(project, referenceString)
      this.addAlias(alias, reference)
    })
  }

  public getDTO(): AliasesDTO {
    return Object.entries(this.aliases.value).reduce((acc: Record<string, string>, [alias, reference]) => {
      acc[alias] = reference.value.toStringWithGrid()
      return acc
    }, {})
  }

  public addAlias(alias: string, reference: Reference) {
    if (!isAliasName(alias)) {
      this.project.pubSub.publish({
        type: 'Alert',
        eventName: 'error',
        data: {
          title: 'Invalid alias name',
          body: 'Alias names must start with a capital letter and can only contain letters, numbers, underscores, and hyphens.',
        },
      })
      return
    }
    if (reference instanceof CellReference) {
      const cellAliasTaken = Object.entries(this.aliases.value)
        .map<[string, Reference]>(([alias, ref]) => [alias, ref.value])
        .filter(([, ref]) => ref instanceof CellReference)
        .find(([, ref]) => ref.equals(reference))

      if (cellAliasTaken) {
        this.project.pubSub.publish({
          type: 'Alert',
          eventName: 'error',
          data: {
            title: 'This alias is already taken',
            body: `The cell you are trying to alias is already taken by another alias (${cellAliasTaken[0]}).`,
          },
        })
        return
      }
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

    if (alias !== newAlias) {
      this.removeAlias(alias)
    }

    this.addAlias(newAlias, newReference)

    this.project.transformAllReferences({
      type: 'renameIdentifier',
      oldIdentifier: alias,
      newIdentifier: newAlias,
    })
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
