const hoveredCellId = ref<string | null>(null)
export function useHover() {
  return {
    hoveredCellId,
  }
}
