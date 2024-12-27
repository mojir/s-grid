import type { Grid } from './grid/Grid'
import { CellReference } from './reference/CellReference'
import { RangeReference } from './reference/RangeReference'
import { getRowId } from './utils'

export class Row {
  private readonly _index: Ref<number>
  private readonly _height: Ref<number>
  public readonly label: ComputedRef<string>
  public constructor(
    private readonly grid: Grid,
    index: number,
    height: number,
  ) {
    this._index = ref(index)
    this._height = ref(height)
    this.label = computed(() => getRowId(this._index.value))

    watch(this._height, (newValue, oldValue) => {
      this.grid.project.history.registerChange({
        type: 'rowHeight',
        gridName: this.grid.name.value,
        rowIndex: this._index.value,
        oldValue,
        newValue,
      })
    })
  }

  public index = computed(() => this._index.value)
  public height = computed(() => this._height.value)

  public setIndex = (index: number) => {
    this._index.value = index
  }

  public setHeight = (height: number) => {
    this._height.value = height
  }

  toRangeReference(): RangeReference {
    return RangeReference.fromCellReferences(
      CellReference.fromCoords(this.grid, { rowIndex: this.index.value, colIndex: 0 }),
      CellReference.fromCoords(this.grid, { rowIndex: this.index.value, colIndex: this.grid.cols.value.length - 1 }),
    )
  }
}
