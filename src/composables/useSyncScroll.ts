import type { ShallowRef } from "vue"

let activeScrollElement: HTMLElement | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null

export function useSyncScroll(
  sheetRef: Readonly<ShallowRef<HTMLElement | null>>,
  rowHeaderRef: Readonly<ShallowRef<HTMLElement | null>>,
  colHeaderRef: Readonly<ShallowRef<HTMLElement | null>>
) {

  function syncScroll(event: Event) {
    // Avoid looping when another div trigger scroll event
    if (activeScrollElement && activeScrollElement !== event.target) {
      return
    }

    activeScrollElement = event.target as HTMLElement

    if (activeScrollElement === sheetRef.value) {
      rowHeaderRef.value!.scrollTop = activeScrollElement.scrollTop
      colHeaderRef.value!.scrollLeft = activeScrollElement.scrollLeft
    } else if (activeScrollElement === rowHeaderRef.value) {
      sheetRef.value!.scrollTop = activeScrollElement.scrollTop
    } else if (activeScrollElement === colHeaderRef.value) {
      sheetRef.value!.scrollLeft = activeScrollElement.scrollLeft
    }

    // Reset scrollingDiv after sync to allow future scroll events
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }
    scrollTimer = setTimeout(() => {
      activeScrollElement = null
      scrollTimer = null
    }, 20)
  }

  return syncScroll
}