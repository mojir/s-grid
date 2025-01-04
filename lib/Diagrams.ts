import type { Diagram } from './Diagram'
import type { Project } from './project/Project'
import { isReferenceString } from './reference/utils'
import type { ReferenceTransformation } from './transformer'

const diagramNameRegexp = /^[A-Z][a-zA-Z0-9_-]*$/

export function isDiagramName(diagramName: string): boolean {
  if (isReferenceString(diagramName)) {
    return false
  }
  return diagramNameRegexp.test(diagramName)
}
export class Diagrams {
  public diagrams = shallowRef<Record<string, Diagram>>({})

  constructor(private project: Project, diagrams: Record<string, Diagram>) {
    this.diagrams.value = diagrams
  }

  public addDiagram(diagramName: string, diagram: Diagram) {
    if (!isDiagramName(diagramName)) {
      throw new Error(`Invalid diagram name: ${diagramName}`)
    }
    if (this.diagrams.value[diagramName]) {
      throw new Error(`Diagram ${diagramName} already exists`)
    }
    this.diagrams.value = {
      ...this.diagrams.value,
      [diagramName]: diagram,
    }
  }

  public updateDiagram(diagramName: string, { newName, newDiagram }: { newName: string, newDiagram: Diagram }) {
    if (!isDiagramName(diagramName)) {
      throw new Error(`Invalid diagram name: ${diagramName}`)
    }
    const currentDiagram = this.diagrams.value[diagramName]
    if (!currentDiagram) {
      throw new Error(`Diagram ${diagramName} does not exist`)
    }

    currentDiagram.dataReference.value = newDiagram.dataReference.value
    // Add support for changing other values

    if (diagramName !== newName) {
      this.addDiagram(newName, currentDiagram)
      this.removeDiagram(diagramName)
    }
  }

  public removeDiagram(diagramName: string) {
    if (!isDiagramName(diagramName)) {
      throw new Error(`Invalid diagram name: ${diagramName}`)
    }

    const diagram = this.diagrams.value[diagramName]
    if (!diagram) {
      throw new Error(`Diagram ${diagramName} does not exist`)
    }

    this.diagrams.value = Object.entries(this.diagrams.value)
      .filter(([key]) => key !== diagramName)
      .reduce((acc: Record<string, Diagram>, [key, diagram]) => {
        acc[key] = diagram
        return acc
      }, {})
  }

  public transformReferences(transformation: ReferenceTransformation) {
    console.error('transformReferences not implemented!', transformation)
  }
}
