import { createSharedComposable } from '@vueuse/core'
import { Grid } from '~/lib/Grid'

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

const colorModeRef: Ref<Ref<string> | null> = ref(null)

export function setColorMode(colorMode: Ref<string>) {
  colorModeRef.value = colorMode
}

const grid1 = new Grid()
const grid2 = new Grid()
const currentGrid = shallowRef(grid1)

export function switchGrid() {
  if (currentGrid.value === grid1) {
    currentGrid.value = grid2
  }
  else {
    currentGrid.value = grid1
  }
}
export const useCurrentGrid = createSharedComposable(() => {
  return currentGrid
})

export type GridComposable = ReturnType<typeof useCurrentGrid>
