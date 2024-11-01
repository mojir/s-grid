const debugMode = ref(true)

export function useDebug() {
  return {
    debugMode,
  }
}
