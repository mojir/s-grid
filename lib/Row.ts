import type { Grid } from './grid/Grid'
import { getRowId } from './utils'

export class Row {
  public readonly index: Ref<number>
  public readonly height: Ref<number>
  public readonly label: ComputedRef<string>
  public constructor(
    private readonly grid: Grid,
    index: number,
    height: number,
  ) {
    this.index = ref(index)
    this.height = ref(height)
    this.label = computed(() => getRowId(this.index.value))

    watch(this.height, (newValue, oldValue) => {
      this.grid.project.history.registerChange({
        type: 'rowHeight',
        gridName: this.grid.name.value,
        row: this.index.value,
        oldValue,
        newValue,
      })
    })
  }
}
