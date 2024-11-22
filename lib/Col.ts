import { getColId } from './locator/ColLocator'

// const resizeColIdRegExp = /^resize-col:([A-Z]{1,2})$/
// export function isResizeColId(id: string): boolean {
//   return resizeColIdRegExp.test(id)
// }

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
