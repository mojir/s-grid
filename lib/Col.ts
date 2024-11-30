import { getColId } from './utils'

export class Col {
  public readonly index: Ref<number>
  public readonly width: Ref<number>
  public readonly label: ComputedRef<string>

  public constructor(
    index: number,
    width: number,
  ) {
    this.index = ref(index)
    this.width = ref(width)
    this.label = computed(() => getColId(this.index.value))
  }
}
