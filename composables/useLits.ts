import { Lits } from '@mojir/lits'

const defaultLits = new Lits()
const litsDebug = new Lits({ debug: true })

export default function useLits() {
  const { debugMode } = useDebug()

  return computed(() => (debugMode.value ? litsDebug : defaultLits))
}

export type LitsComposable = ReturnType<typeof useLits>
