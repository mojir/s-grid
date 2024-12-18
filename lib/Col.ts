import type { Grid } from './grid/Grid'
import { getColId } from './utils'

export class Col {
  public readonly index: Ref<number>
  public readonly width: Ref<number>
  public readonly label: ComputedRef<string>

  public constructor(
    private readonly grid: Grid,
    index: number,
    width: number,
  ) {
    this.index = ref(index)
    this.width = ref(width)
    this.label = computed(() => getColId(this.index.value))

    watch(this.width, (newValue, oldValue) => {
      this.grid.project.history.registerChange({
        type: 'colWidth',
        gridName: this.grid.name.value,
        col: this.index.value,
        oldValue,
        newValue,
      })
    })
  }
}
