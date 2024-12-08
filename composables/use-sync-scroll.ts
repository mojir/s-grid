import type { Ref } from 'vue'
import type ColHeader from '~/components/col-header/ColHeader.vue'
import type GridView from '~/components/grid-view/GridView.vue'
import type RowHeader from '~/components/row-header/RowHeader.vue'

let activeScrollElement: HTMLElement | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null

export default function (
  gridViewRef: Ref<typeof GridView>,
  rowHeaderRef: Ref<typeof RowHeader>,
  colHeaderRef: Ref<typeof ColHeader>,
  updateScrollPosition: (value: { scrollTop?: number, scrollLeft?: number }) => void,
) {
  function syncScroll(event: Event) {
    if (!gridViewRef.value || !rowHeaderRef.value || !colHeaderRef.value) {
      return
    }
    // Avoid looping when another div trigger scroll event
    if (activeScrollElement && activeScrollElement !== event.target) {
      return
    }

    activeScrollElement = event.target as HTMLElement

    if (activeScrollElement === gridViewRef.value.$el) {
      rowHeaderRef.value.$el.scrollTop = activeScrollElement.scrollTop
      colHeaderRef.value.$el.scrollLeft = activeScrollElement.scrollLeft
      updateScrollPosition({ scrollTop: activeScrollElement.scrollTop, scrollLeft: activeScrollElement.scrollLeft })
    }
    else if (activeScrollElement === rowHeaderRef.value.$el) {
      gridViewRef.value.$el.scrollTop = activeScrollElement.scrollTop
      updateScrollPosition({ scrollTop: activeScrollElement.scrollTop })
    }
    else if (activeScrollElement === colHeaderRef.value.$el) {
      gridViewRef.value.$el.scrollLeft = activeScrollElement.scrollLeft
      updateScrollPosition({ scrollLeft: activeScrollElement.scrollLeft })
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

  function setScrollPosition({ scrollLeft, scrollTop }: { scrollTop: number, scrollLeft: number }) {
    if (!gridViewRef.value || !rowHeaderRef.value || !colHeaderRef.value) {
      return
    }
    gridViewRef.value.$el.scrollTop = scrollTop
    gridViewRef.value.$el.scrollLeft = scrollLeft
    rowHeaderRef.value.$el.scrollTop = scrollTop
    colHeaderRef.value.$el.scrollLeft = scrollLeft
  }

  return {
    syncScroll,
    setScrollPosition,
  }
}
