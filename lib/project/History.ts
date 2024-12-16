import type { Cell } from '../Cell'
import type { Project } from './Project'
import type { CellDTO } from '~/dto/CellDTO'

type CellChangeItem = {
  cell: Cell
  attribute: Exclude<keyof CellDTO, 'style' | 'alias'>
  oldValue: unknown
  newValue: unknown
}

type ChangeEntry = CellChangeItem

export class History {
  public constructor(private project: Project) {}
  private currentChanges: ChangeEntry[] = []
  private timer: null | ReturnType<typeof setTimeout> = null
  private readonly undoStack = shallowRef<ChangeEntry[][]>([])
  private readonly redoStack = shallowRef<ChangeEntry[][]>([])
  private paused = true

  public canUndo = computed(() => this.undoStack.value.length > 0)
  public canRedo = computed(() => this.redoStack.value.length > 0)

  public registerChange(change: ChangeEntry): void {
    if (this.paused) {
      return
    }
    this.currentChanges.push(change)
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(() => {
      this.timer = null
      this.commitChanges()
    })
  }

  public start(): void {
    this.paused = false
  }

  public undo(): void {
    const changes = this.undoStack.value.pop()
    if (!changes) {
      return
    }

    this.paused = true

    this.undoStack.value = [...this.undoStack.value]
    for (const change of changes!) {
      this.applyChange(change, 'undo')
    }
    this.redoStack.value = [...this.redoStack.value, changes!]

    nextTick(() => {
      this.paused = false
    })
  }

  public redo(): void {
    const changes = this.redoStack.value.pop()

    if (!changes) {
      return
    }

    this.paused = true

    this.redoStack.value = [...this.redoStack.value]
    for (const change of changes) {
      this.applyChange(change, 'redo')
    }
    this.undoStack.value = [...this.undoStack.value, changes]

    nextTick(() => {
      this.paused = false
    })
  }

  private commitChanges(): void {
    if (this.currentChanges.length === 0) {
      return
    }
    this.undoStack.value = [...this.undoStack.value, this.currentChanges]
    this.currentChanges = []
    this.redoStack.value = []
  }

  private applyChange(change: ChangeEntry, method: 'undo' | 'redo'): void {
    const { cell, attribute, oldValue, newValue } = change
    cell.setDTO({ [attribute]: method === 'undo' ? oldValue : newValue })
  }
}
