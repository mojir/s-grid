let ctrlKeyTime: number | null = null

type TabId = 'repl' | 'settings' | 'debug'
type Tab = {
  id: TabId
  name: string
}
const tabs = readonly(ref<Tab[]>([
  { id: 'repl', name: 'Lisp REPL' },
  { id: 'settings', name: 'Settings' },
  { id: 'debug', name: 'Debug' },
]))

const sidePanelOpen = ref<boolean>(false)
const currentTab = ref<TabId>('repl')

const sidePanelHandleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Control') {
    if (ctrlKeyTime === null) {
      ctrlKeyTime = Date.now()
    }
    else {
      if (Date.now() - ctrlKeyTime < 300) {
        sidePanelOpen.value = !sidePanelOpen.value
        ctrlKeyTime = null
      }
      else {
        ctrlKeyTime = Date.now()
      }
    }
  }
  else {
    ctrlKeyTime = null
  }
}

export function useSidePanel() {
  return {
    tabs,
    currentTab,
    sidePanelOpen,
    sidePanelHandleKeyDown,
  }
}
