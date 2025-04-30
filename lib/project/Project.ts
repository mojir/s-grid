import { Aliases } from '../Aliases'
import { defaultNbrOfCols, defaultNbrOfRows } from '../constants'
import { Grid } from '../grid/Grid'
import { getReferenceFromString } from '../reference/utils'
import { REPL } from '../REPL'
import { transformLitsPrograms } from '../transformer/litsTransformer'
import type { Cell } from '../cell/Cell'
import type { Transformation } from '../transformer'
import { Diagrams } from '../Diagrams'
import { PubSub } from '../PubSub'
import { ProjectClipboard } from './ProjectClipboard'
import { AutoFiller } from './AutoFiller'
import { History } from './History'
import { Saver } from './Saver'
import { CommandCenter } from '~/lib/CommandCenter'
import type { GridDTO } from '~/dto/GridDTO'
import { createEmptyProject, type ProjectDTO } from '~/dto/ProjectDTO'

export class Project {
  public readonly name = ref('')
  public readonly pubSub = new PubSub()
  public readonly repl = new REPL(this)
  public readonly commandCenter = new CommandCenter(this)
  public readonly clipboard = new ProjectClipboard(this)
  public readonly currentGridIndex = ref(0)
  public readonly currentGrid: ComputedRef<Grid>
  public readonly history = new History(this)
  public readonly autoFiller = new AutoFiller(this)
  public readonly diagrams = new Diagrams(this, [])
  public aliases: Aliases
  public readonly grids: Ref<Grid[]>
  public readonly keyboardClaimed = ref(false)

  private readonly saver = new Saver(this)
  public constructor(projectDTO: ProjectDTO = createEmptyProject()) {
    if (projectDTO.grids.length === 0) {
      throw new Error('Project must have at least one grid')
    }
    if (projectDTO.currentGridIndex < 0 || projectDTO.currentGridIndex >= projectDTO.grids.length) {
      throw new Error('Invalid currentGridIndex')
    }

    this.name.value = projectDTO.name
    this.grids = shallowRef(projectDTO.grids.map(gridDTO => Grid.fromDTO(this, gridDTO)))
    this.currentGridIndex = ref(projectDTO.currentGridIndex)
    this.currentGrid = computed(() => {
      return this.grids.value[this.currentGridIndex.value]!
    })
    this.aliases = new Aliases(this, projectDTO.aliases)
    this.commandCenter.registerCommands()
    nextTick(() => this.history.start())
  }

  public clear() {
    if (window !== undefined) {
      this.saver.clear()
      window.location.reload()
    }
  }

  public getDTO(): ProjectDTO {
    return {
      name: this.name.value,
      grids: this.grids.value.map(grid => grid.getDTO()),
      currentGridIndex: this.currentGridIndex.value,
      aliases: this.aliases.getDTO(),
    }
  }

  public setDTO(dto: ProjectDTO) {
    if (window !== undefined) {
      this.saver.save(dto)
      location.reload()
    }
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
    this.saver.save()
  }

  public renameGrid(grid: Grid, newName: string) {
    const oldGridName = grid.name.value
    const newGridName = getGridName(newName)
    this.transformAllReferences({
      type: 'renameGrid',
      grid,
      newName: newGridName,
    })
    grid.name.value = newGridName
    this.pubSub.publish({
      type: 'Change',
      eventName: 'gridChange',
      data: {
        attribute: 'name',
        oldValue: oldGridName,
        newValue: newGridName,
      },
    })
    this.saver.save()
  }

  public addGrid() {
    let gridIndex = this.grids.value.length + 1
    let gridName = `Grid${gridIndex}`
    while (this.grids.value.find(grid => grid.name.value === getGridName(gridName))) {
      gridIndex += 1
      gridName = `Grid${gridIndex}`
    }

    this.grids.value = [
      ...this.grids.value, new Grid({
        project: this,
        name: gridName,
        nbrOfRows: defaultNbrOfRows,
        nbrOfCols: defaultNbrOfCols,
      }),
    ]
    this.saver.save()
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
    if (transformation.type !== 'renameIdentifier') {
      this.aliases.transformReferences(transformation)
      this.diagrams.transformReferences(transformation)
    }
    this.getAllCells().forEach((cell) => {
      transformLitsPrograms({ cell, transformation })
    })
  }

  public getGridByName(gridName: string): Grid {
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
