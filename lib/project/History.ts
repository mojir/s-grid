import type { Project } from './Project'
import type { CellDTO } from '~/dto/CellDTO'

export type CellChangeItem = {
  type: 'cell'
  gridName: string
  rowIndex: number
  colIndex: number
  attribute: Exclude<keyof CellDTO, 'style' | 'alias'>
  oldValue: unknown
  newValue: unknown
}

export type RowChangeItem = {
  type: 'rowHeight'
  gridName: string
  rowIndex: number
  oldValue: number
  newValue: number
}

export type ColChangeItem = {
  type: 'colWidth'
  gridName: string
  colIndex: number
  oldValue: number
  newValue: number
}

type ChangeEntry = CellChangeItem | RowChangeItem | ColChangeItem

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
    if (change.type === 'cell') {
      const grid = this.project.getGrid(change.gridName)
      const cell = grid.cells[change.rowIndex][change.colIndex]
      cell.setDTO({ [change.attribute]: method === 'undo' ? change.oldValue : change.newValue })
    }
    else if (change.type === 'rowHeight') {
      const grid = this.project.getGrid(change.gridName)
      grid.rows.value[change.rowIndex].height.value = method === 'undo' ? change.oldValue : change.newValue
    }
    else if (change.type === 'colWidth') {
      const grid = this.project.getGrid(change.gridName)
      grid.cols.value[change.colIndex].width.value = method === 'undo' ? change.oldValue : change.newValue
    }
  }
}
