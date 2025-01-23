import type { SGridEvent } from '../PubSub/pubSubEvents'
import type { Project } from './Project'

function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`value was not a string: ${value}`)
  }
}

export class History {
  public constructor(private project: Project) {
    this.project.pubSub.subscribe(this.onPubSubEvent.bind(this))
  }

  private currentChanges: SGridEvent[] = []
  private timer: null | ReturnType<typeof setTimeout> = null
  private readonly undoStack = shallowRef<SGridEvent[][]>([])
  private readonly redoStack = shallowRef<SGridEvent[][]>([])
  private paused = true

  public canUndo = computed(() => this.undoStack.value.length > 0)
  public canRedo = computed(() => this.redoStack.value.length > 0)

  private onPubSubEvent(event: SGridEvent) {
    if (this.paused) {
      return
    }
    this.currentChanges.push(event)
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

  private applyChange(event: SGridEvent, method: 'undo' | 'redo'): void {
    if (event.type === 'cellChange') {
      const { data, gridName } = event
      const grid = this.project.getGridByName(gridName)
      const cell = grid.getCell(data)
      cell.setDTO({ [data.attribute]: method === 'undo' ? data.oldValue : data.newValue })
    }
    else if (event.type === 'rowChange') {
      const { data, gridName } = event
      const grid = this.project.getGridByName(gridName)
      const row = grid.getRow(data.rowIndex)
      row.setHeight(method === 'undo' ? data.oldValue : data.newValue)
    }
    else if (event.type === 'colChange') {
      const { data, gridName } = event
      const grid = this.project.getGridByName(gridName)
      const col = grid.getCol(data.colIndex)
      col.setWidth(method === 'undo' ? data.oldValue : data.newValue)
    }
    else if (event.type === 'gridChange') {
      const { data: { attribute, newValue, oldValue } } = event
      switch (attribute) {
        case 'name':
          assertString(newValue)
          assertString(oldValue)

          if (method === 'undo') {
            this.project.renameGrid(this.project.getGridByName(newValue), oldValue)
          }
          else {
            this.project.renameGrid(this.project.getGridByName(oldValue), newValue)
          }
          break
      }
    }
    else if (event.type === 'rowsRemoved') {
      const { data, gridName } = event
      const grid = this.project.getGridByName(gridName)
      if (method === 'undo') {
        grid.insertRowsBefore(data.rowIndex, data.count, data.deletedRows)
      }
      else {
        grid.deleteRows(data.rowIndex, data.count)
      }
    }
    else if (event.type === 'colsRemoved') {
      const { data, gridName } = event
      const grid = this.project.getGridByName(gridName)
      if (method === 'undo') {
        grid.insertColsBefore(data.colIndex, data.count, data.deletedCols)
      }
      else {
        grid.deleteCols(data.colIndex, data.count)
      }
    }
    else if (event.type === 'rowsInserted') {
      const { data, gridName } = event
      const grid = this.project.getGridByName(gridName)
      if (method === 'undo') {
        grid.deleteRows(data.rowIndex, data.count)
      }
      else {
        grid.insertRowsBefore(data.rowIndex, data.count)
      }
    }
    else if (event.type === 'colsInserted') {
      const { data, gridName } = event
      const grid = this.project.getGridByName(gridName)
      if (method === 'undo') {
        grid.deleteCols(data.colIndex, data.count)
      }
      else {
        grid.insertColsBefore(data.colIndex, data.count)
      }
    }
    else {
      const exhaustiveCheck: never = event
      throw new Error(`Unhandled event type: ${exhaustiveCheck}`)
    }
  }
}
