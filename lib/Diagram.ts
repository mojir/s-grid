import type { Grid } from './grid/Grid'
import type { Rectangle } from './layout/Rectangle'
import type { RangeReference } from './reference/RangeReference'

export class Diagram {
  public readonly name = ref('')
  public readonly grid: Ref<Grid>
  public readonly rectangle: Ref<Rectangle>
  public readonly dataReference = shallowRef<RangeReference | null>(null)
  public readonly title = ref('')

  constructor({
    name,
    grid,
    rectangle,
  }: {
    name: string
    grid: Grid
    rectangle: Rectangle
  }) {
    this.name.value = name
    this.grid = shallowRef(grid)
    this.rectangle = shallowRef(rectangle)
  }
}
