import type { Grid } from './grid/Grid'
import { CellReference } from './reference/CellReference'
import { RangeReference } from './reference/RangeReference'
import { getColId } from './utils'

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

    watch(this._width, (newValue, oldValue) => {
      this.grid.project.history.registerChange({
        type: 'colWidth',
        gridName: this.grid.name.value,
        colIndex: this._index.value,
        oldValue,
        newValue,
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
