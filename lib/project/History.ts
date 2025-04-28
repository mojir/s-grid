import type { ChangeEvent, SGridEvent } from '../PubSub/pubSubEvents'
import { pauseLitsTransformer, resumeLitsTransformer } from '../transformer/litsTransformer'
import type { Project } from './Project'

function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`value was not a string: ${value}`)
  }
}

export class History {
  public constructor(private project: Project) {
    this.project.pubSub.subscribe({
      filter: { Change: true },
      callback: this.onPubSubEvent.bind(this),
    })
  }

  private changePromise: null | Promise<void> = null
  private resolveChangePromise: (() => void) | null = null

  private currentChanges: ChangeEvent[] = []
  private timer: null | ReturnType<typeof setTimeout> = null
  private readonly undoStack = shallowRef<ChangeEvent[][]>([])
  private readonly redoStack = shallowRef<ChangeEvent[][]>([])
  private paused = true

  public canUndo = computed(() => this.undoStack.value.length > 0)
  public canRedo = computed(() => this.redoStack.value.length > 0)

  private onPubSubEvent(event: SGridEvent) {
    const changeEvent = event as ChangeEvent
    if (this.paused) {
      return
    }
    this.currentChanges.unshift(changeEvent)
    if (this.timer) {
      clearTimeout(this.timer)
    }
    else {
      this.changePromise = new Promise((resolve) => {
        this.resolveChangePromise = resolve
      })
    }
    this.timer = setTimeout(() => {
      this.resolveChangePromise!()
      this.resolveChangePromise = null
      this.changePromise = null
      this.timer = null
      this.commitChanges()
    })
  }

  public clear(): void {
    this.undoStack.value = []
    this.redoStack.value = []
    this.currentChanges = []
    this.timer = null
    this.changePromise = null
    this.resolveChangePromise = null
    this.paused = false
  }

  public start(): void {
    this.paused = false
  }

  public async undo(): Promise<void> {
    await this.changePromise
    const changes = this.undoStack.value.pop()
    if (!changes) {
      return
    }

    pauseLitsTransformer()
    this.paused = true

    this.undoStack.value = [...this.undoStack.value]
    for (const change of changes) {
      this.applyChange(change, 'undo')
    }
    this.redoStack.value = [...this.redoStack.value, changes!]

    await nextTick()
    this.paused = false
    resumeLitsTransformer()
  }

  public async redo(): Promise<void> {
    await this.changePromise
    const changes = this.redoStack.value.pop()

    if (!changes) {
      return
    }

    pauseLitsTransformer()
    this.paused = true

    this.redoStack.value = [...this.redoStack.value]
    for (const change of changes) {
      this.applyChange(change, 'redo')
    }
    this.undoStack.value = [...this.undoStack.value, changes]

    await nextTick()
    this.paused = false
    resumeLitsTransformer()
  }

  private commitChanges(): void {
    if (this.currentChanges.length === 0) {
      return
    }
    this.undoStack.value = [...this.undoStack.value, this.currentChanges]
    this.currentChanges = []
    this.redoStack.value = []
  }

  private applyChange(event: ChangeEvent, method: 'undo' | 'redo'): void {
    switch (event.eventName) {
      case 'cellChange': {
        const { data } = event
        const grid = this.project.getGridByName(data.gridName)
        const cell = grid.getCell(data)
        cell.setDTO({ [data.attribute]: method === 'undo' ? data.oldValue : data.newValue })
        break
      }
      case 'rowChange': {
        const { data } = event
        const grid = this.project.getGridByName(data.gridName)
        const row = grid.getRow(data.rowIndex)
        row.setHeight(method === 'undo' ? data.oldHeight : data.newHeight)
        break
      }
      case 'colChange': {
        const { data } = event
        const grid = this.project.getGridByName(data.gridName)
        const col = grid.getCol(data.colIndex)
        col.setWidth(method === 'undo' ? data.oldWidth : data.newWidth)
        break
      }
      case 'gridChange': {
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
        break
      }
      case 'rowsRemoved': {
        const { data } = event
        const grid = this.project.getGridByName(data.gridName)
        if (method === 'undo') {
          grid.insertRowsBefore(data.rowIndex, data.count, data.cells.map(cell => cell.getDTO()))
          data.heights.forEach((height, index) => grid.getRow(data.rowIndex + index).setHeight(height))
        }
        else {
          grid.deleteRows(data.rowIndex, data.count)
        }
        break
      }
      case 'colsRemoved': {
        const { data } = event
        const grid = this.project.getGridByName(data.gridName)
        if (method === 'undo') {
          grid.insertColsBefore(data.colIndex, data.count, data.cells.map(cell => cell.getDTO()))
          data.widths.forEach((width, index) => grid.getCol(data.colIndex + index).setWidth(width))
        }
        else {
          grid.deleteCols(data.colIndex, data.count)
        }
        break
      }
      case 'rowsInserted': {
        const { data } = event
        const grid = this.project.getGridByName(data.gridName)
        if (method === 'undo') {
          grid.deleteRows(data.rowIndex, data.count)
        }
        else {
          grid.insertRowsBefore(data.rowIndex, data.count)
        }
        break
      }
      case 'colsInserted': {
        const { data } = event
        const grid = this.project.getGridByName(data.gridName)
        if (method === 'undo') {
          grid.deleteCols(data.colIndex, data.count)
        }
        else {
          grid.insertColsBefore(data.colIndex, data.count)
        }
        break
      }
      default: {
        throw new Error(`Unhandled event type: ${event satisfies never}`)
      }
    }
  }
}
