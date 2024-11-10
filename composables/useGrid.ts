import { createSharedComposable } from '@vueuse/core'
import { customRef, shallowReadonly } from 'vue'
import { Grid } from '~/lib/Grid'

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

const colorModeRef: Ref<Ref<string> | null> = ref(null)

export function setColorMode(colorMode: Ref<string>) {
  colorModeRef.value = colorMode
}

export const useGrid = createSharedComposable(() => {
  const grid = shallowReadonly(customRef((track) => {
    const gridInstance = new Grid({
      rowsAndCols: useRowsAndCols(),
      selection: useSelection(),
      alias: useAlias(),
      lits: useLits(),
      commandCenter: useCommandCenter(),
    })
    return {
      get() {
        track()
        return gridInstance
      },
      set() { },
    }
  }))

  return grid
})

export type GridComposable = ReturnType<typeof useGrid>
