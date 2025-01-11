import type { Diagram } from './Diagram'
import { Rectangle } from './layout/Rectangle'
import type { Project } from './project/Project'
import { isReferenceString } from './reference/utils'
import type { ReferenceTransformation } from './transformer'
import { transformReference } from './transformer/referenceTransformer'
import { getIdFromTarger } from './utils'

const { sidePanelOpen, currentTab } = useSidePanel()

const diagramNameRegexp = /^[A-Z][a-zA-Z0-9_-]*$/

export function isDiagramName(diagramName: string): boolean {
  if (isReferenceString(diagramName)) {
    return false
  }
  return diagramNameRegexp.test(diagramName)
}

type Handle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w' | 'move'
function isHandle(value: unknown): value is Handle {
  if (typeof value !== 'string') {
    return false
  }
  return ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w', 'move'].includes(value)
}

type MoveHandle = {
  diagram: Diagram
  rectangle: Rectangle
  handle: Handle
  startX: number
  startY: number
  aspectRatio: number
}

const minDiagramWidth = 60
const minDiagramHeight = 40

export class Diagrams {
  private moveHandle: null | MoveHandle = null
  private moveDownTime = 0
  public diagrams = shallowRef<Diagram[]>([])
  public activeDiagram = shallowRef<Diagram | null>(null)
  public editingDiagram = shallowRef<Diagram | null>(null)

  constructor(private project: Project, diagrams: Diagram[]) {
    this.diagrams.value = diagrams
    watch(this.editingDiagram, () => {
      if (this.editingDiagram.value) {
        this.activeDiagram.value = this.editingDiagram.value
      }
    })
  }

  public currentDiagrams = computed(() => {
    return this.diagrams.value.filter(d => d.grid.value === this.project.currentGrid.value)
  })

  public getNewDiagramName(): string {
    const existingNames = this.diagrams.value.map(d => d.name.value)
    let i = 1
    while (true) {
      const name = `Diagram${i}`
      if (!existingNames.includes(name)) {
        return name
      }
      i += 1
    }
  }

  public addDiagram(diagram: Diagram) {
    if (!isDiagramName(diagram.name.value)) {
      throw new Error(`Invalid diagram name: ${diagram.name.value}`)
    }
    if (this.getDiagram(diagram.name.value)) {
      throw new Error(`Diagram ${diagram.name.value} already exists`)
    }
    this.diagrams.value = [
      ...this.diagrams.value,
      diagram,
    ].sort((a, b) => a.name.value.toLocaleLowerCase().localeCompare(b.name.value.toLocaleLowerCase()))
  }

  public diagramUpdated(diagram: Diagram) {
    if (!this.diagrams.value.includes(diagram)) {
      throw new Error(`Diagram ${diagram.name.value} does not exist`)
    }
    this.diagrams.value = [
      ...this.diagrams.value,
    ].sort((a, b) => a.name.value.toLocaleLowerCase().localeCompare(b.name.value.toLocaleLowerCase()))
  }

  public removeDiagram(diagram: Diagram) {
    if (!this.diagrams.value.includes(diagram)) {
      throw new Error(`Diagram ${diagram.name.value} does not exist`)
    }

    this.diagrams.value = this.diagrams.value
      .filter(d => d !== diagram)
  }

  public transformReferences(transformation: ReferenceTransformation) {
    Object.entries(this.diagrams.value)
      .filter(([_, diagram]) => !!diagram.dataReference.value)
      .filter(([_, diagram]) => diagram.dataReference.value!.grid === transformation.grid)
      .forEach(([_, diagram]) => {
        try {
          diagram.dataReference.value = transformReference(diagram.dataReference.value!, transformation)
        }
        catch {
          diagram.dataReference.value = null
        }
      })
  }

  public getDiagram(diagramName: string): Diagram | undefined {
    return this.diagrams.value.find(d => d.name.value === diagramName)
  }

  public openDiagramEditor(diagramName: string) {
    const diagram = this.getDiagram(diagramName)
    if (!diagram) {
      throw new Error(`Diagram ${diagramName} does not exist`)
    }
    sidePanelOpen.value = true
    currentTab.value = 'diagrams'
    this.editingDiagram.value = diagram
  }

  public handleMouseDown(event: MouseEvent) {
    const now = Date.now()
    const id = getIdFromTarger(event.target, 'diagram')
    if (!id) {
      return
    }
    const [, diagramId, option] = id.split('|')
    const diagram = diagramId && this.getDiagram(diagramId)
    if (!diagram || !option) {
      return
    }
    const handle = option.split('-')[1]
    if (!isHandle(handle)) {
      return
    }
    if (now - this.moveDownTime < 500) {
      this.moveDownTime = 0
      this.openDiagramEditor(diagram.name.value)
      return
    }
    this.moveDownTime = now

    this.moveHandle = {
      diagram,
      rectangle: diagram.rectangle.value,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      aspectRatio: diagram.rectangle.value.width / diagram.rectangle.value.height,
    }
  }

  public handleMouseMove(event: MouseEvent) {
    if (!this.moveHandle) {
      return
    }
    const { handle, diagram, rectangle, startX, startY } = this.moveHandle
    let dx = event.clientX - startX
    let dy = event.clientY - startY
    let x
    let y
    let width
    let height
    switch (handle) {
      case 'nw': {
        dx = Math.min(dx, rectangle.width - minDiagramWidth)
        dy = Math.min(dy, rectangle.height - minDiagramHeight)
        const newAspectRatio = (rectangle.width - dx) / (rectangle.height - dy)
        if (newAspectRatio < this.moveHandle.aspectRatio) {
          dx = dy * this.moveHandle.aspectRatio
        }
        else {
          dy = dx / this.moveHandle.aspectRatio
        }
        x = rectangle.x + dx
        y = rectangle.y + dy
        width = rectangle.width - dx
        height = rectangle.height - dy
        break
      }
      case 'ne': {
        dx = Math.max(dx, minDiagramWidth - rectangle.width)
        dy = Math.min(dy, rectangle.height - minDiagramHeight)
        const newAspectRatio = (rectangle.width + dx) / (rectangle.height - dy)
        if (newAspectRatio < this.moveHandle.aspectRatio) {
          dx = (rectangle.height - dy) * this.moveHandle.aspectRatio - rectangle.width
        }
        else {
          dy = rectangle.height - (rectangle.width + dx) / this.moveHandle.aspectRatio
        }
        x = rectangle.x
        y = rectangle.y + dy
        width = rectangle.width + dx
        height = rectangle.height - dy
        break
      }
      case 'se': {
        dx = Math.max(dx, minDiagramWidth - rectangle.width)
        dy = Math.max(dy, minDiagramHeight - rectangle.height)
        const newAspectRatio = (rectangle.width + dx) / (rectangle.height + dy)
        if (newAspectRatio < this.moveHandle.aspectRatio) {
          dx = dy * this.moveHandle.aspectRatio
        }
        else {
          dy = dx / this.moveHandle.aspectRatio
        }
        x = rectangle.x
        y = rectangle.y
        width = rectangle.width + dx
        height = rectangle.height + dy
        break
      }
      case 'sw': {
        dx = Math.min(dx, rectangle.width - minDiagramWidth)
        dy = Math.max(dy, minDiagramHeight - rectangle.height)
        const newAspectRatio = (rectangle.width - dx) / (rectangle.height + dy)
        if (newAspectRatio < this.moveHandle.aspectRatio) {
          dx = rectangle.width - (rectangle.height + dy) * this.moveHandle.aspectRatio
        }
        else {
          dy = (rectangle.width - dx) / this.moveHandle.aspectRatio - rectangle.height
        }
        x = rectangle.x + dx
        y = rectangle.y
        width = rectangle.width - dx
        height = rectangle.height + dy
        break
      }
      case 'n':
        dy = Math.min(dy, rectangle.height - minDiagramHeight)
        x = rectangle.x
        y = rectangle.y + dy
        width = rectangle.width
        height = rectangle.height - dy
        break
      case 'e':
        dx = Math.max(dx, minDiagramWidth - rectangle.width)
        x = rectangle.x
        y = rectangle.y
        width = rectangle.width + dx
        height = rectangle.height
        break
      case 's':
        dy = Math.max(dy, minDiagramHeight - rectangle.height)
        x = rectangle.x
        y = rectangle.y
        width = rectangle.width
        height = rectangle.height + dy
        break
      case 'w':
        dx = Math.min(dx, rectangle.width - minDiagramWidth)
        x = rectangle.x + dx
        y = rectangle.y
        width = rectangle.width - dx
        height = rectangle.height
        break
      case 'move':
        x = rectangle.x + dx
        y = rectangle.y + dy
        width = rectangle.width
        height = rectangle.height
        break
    }
    diagram.rectangle.value = Rectangle.fromPositionAndDimensions({
      position: {
        x,
        y,
      },
      dimensions: {
        width,
        height,
      },
    })
  }

  public handleMouseUp() {
    this.moveHandle = null
  }
}
