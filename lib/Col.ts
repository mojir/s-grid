import type { Grid } from './grid/Grid'
import { CellReference } from './reference/CellReference'
import { RangeReference } from './reference/RangeReference'

export class Col {
  public readonly _index: Ref<number>
  public readonly _width: Ref<number>
  public readonly label: ComputedRef<string>

  public constructor(
    private readonly grid: Grid,
    index: number,
    width: number,
  ) {
    this._index = ref(index)
    this._width = ref(width)
    this.label = computed(() => getColId(this._index.value))

    watch(this._width, (newWidth, oldWidth) => {
      this.grid.pubSub.publish({
        source: 'Col',
        eventName: 'colChange',
        data: {
          gridName: this.grid.name.value,
          colIndex: this._index.value,
          newWidth,
          oldWidth,
        },
      })
    })
  }

  public index = computed(() => this._index.value)
  public width = computed(() => this._width.value)

  public setIndex = (index: number) => {
    this._index.value = index
  }

  public setWidth = (width: number) => {
    this._width.value = width
  }

  public toRangeReference(): RangeReference {
    return RangeReference.fromCellReferences(
      CellReference.fromCoords(this.grid, { rowIndex: 0, colIndex: this.index.value }),
      CellReference.fromCoords(this.grid, { rowIndex: this.grid.rows.value.length - 1, colIndex: this.index.value }),
    )
  }
}
