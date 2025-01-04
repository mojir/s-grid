import type { CellReference } from './reference/CellReference'
import type { RangeReference } from './reference/RangeReference'

export class Diagram {
  public dataReference: Ref<RangeReference>
  public title: string
  public width = 500
  public height = 300
  public anchor: CellReference
  public offsetX: number
  public offsetY: number

  constructor({
    anchor,
    offsetX,
    offsetY,
    dataReference,
    title,
  }: {
    anchor: CellReference
    offsetX: number
    offsetY: number
    dataReference: RangeReference
    title: string
  }) {
    this.dataReference = shallowRef(dataReference)
    this.title = title
    this.anchor = anchor
    this.offsetX = offsetX
    this.offsetY = offsetY
  }
}
