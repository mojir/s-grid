import { getRowId } from './locator/RowLocator'

// const resizeRowIdRegExp = /^resize-row:([1-9]\d{0,3})$/
// export function isResizeRowId(id: string): boolean {
//   return resizeRowIdRegExp.test(id)
// }

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
