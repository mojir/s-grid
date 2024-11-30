import { getRowId } from './utils'

export class Row {
  public readonly index: Ref<number>
  public readonly height: Ref<number>
  public readonly label: ComputedRef<string>
  public constructor(
    index: number,
    height: number,
  ) {
    this.index = ref(index)
    this.height = ref(height)
    this.label = computed(() => getRowId(this.index.value))
  }
}
