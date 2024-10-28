import type { Ref } from 'vue'
import type ColHeader from '@/components/ColHeader.vue'
import type DataGrid from '@/components/DataGrid.vue'
import type RowHeader from '@/components/RowHeader.vue'

let activeScrollElement: HTMLElement | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null

export function useSyncScroll(
  dataGridRef: Ref<typeof DataGrid | undefined>,
  rowHeaderRef: Ref<typeof RowHeader | undefined>,
  colHeaderRef: Ref<typeof ColHeader | undefined>,
) {
  function syncScroll(event: Event) {
    if (!dataGridRef.value || !rowHeaderRef.value || !colHeaderRef.value) {
      return
    }
    // Avoid looping when another div trigger scroll event
    if (activeScrollElement && activeScrollElement !== event.target) {
      return
    }

    activeScrollElement = event.target as HTMLElement

    if (activeScrollElement === dataGridRef.value.el) {
      rowHeaderRef.value.el.scrollTop = activeScrollElement.scrollTop
      colHeaderRef.value.el.scrollLeft = activeScrollElement.scrollLeft
    }
    else if (activeScrollElement === rowHeaderRef.value.el) {
      dataGridRef.value.el.scrollTop = activeScrollElement.scrollTop
    }
    else if (activeScrollElement === colHeaderRef.value.el) {
      dataGridRef.value.el.scrollLeft = activeScrollElement.scrollLeft
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
