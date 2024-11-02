const { debugMode } = useDebug()

type TabId = 'repl' | 'settings' | 'debug'
type Tab = {
  id: TabId
  name: string
}
const allTabs = readonly(ref<Tab[]>([
  { id: 'repl', name: 'Lisp REPL' },
  { id: 'settings', name: 'Settings' },
  { id: 'debug', name: 'Debug' },
]))

const tabs = computed(() => {
  if (debugMode.value) {
    return allTabs.value
  }
  return allTabs.value.filter(tab => tab.id !== 'debug')
})

const sidePanelOpen = ref<boolean>(false)
const currentTab = ref<TabId>('repl')

let ctrlKeyTime: number | null = null
let ctrlCount = 0
const sidePanelHandleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Control') {
    if (ctrlKeyTime === null) {
      ctrlKeyTime = Date.now()
      ctrlCount = 1
    }
    else {
      if (Date.now() - ctrlKeyTime < 500) {
        ctrlCount += 1
        ctrlKeyTime = Date.now()
        if (ctrlCount === 2) {
          if (sidePanelOpen.value) {
            sidePanelOpen.value = false
            ctrlCount = 0
          }
          else {
            sidePanelOpen.value = true
            currentTab.value = 'repl'
          }
        }
        else {
          switch (ctrlCount % 3) {
            case 0:
              currentTab.value = 'settings'
              break
            case 1:
              currentTab.value = 'debug'
              break
            case 2:
              currentTab.value = 'repl'
              break
          }
        }
      }
      else {
        ctrlKeyTime = Date.now()
        ctrlCount = 1
      }
    }
  }
  else {
    ctrlKeyTime = null
    ctrlCount = 0
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
