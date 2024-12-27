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
function sidePanelHandleKeyDown(event: KeyboardEvent): boolean {
  if (event.key === 'Control') {
    if (ctrlKeyTime === null) {
      ctrlKeyTime = Date.now()
    }
    else {
      if (Date.now() - ctrlKeyTime < 500) {
        ctrlKeyTime = null
        sidePanelOpen.value = !sidePanelOpen.value
      }
      else {
        ctrlKeyTime = Date.now()
      }
    }
  }
  else {
    ctrlKeyTime = null
  }

  if (event.key === 'Escape') {
    if (sidePanelOpen.value) {
      sidePanelOpen.value = false
      return true
    }
  }

  if (event.key === 'Tab') {
    if (sidePanelOpen.value) {
      const direction = event.shiftKey ? -1 : 1
      const currentTabIndex = tabs.value.findIndex(tab => tab.id === currentTab.value)
      let nextTabIndex = (currentTabIndex + direction) % tabs.value.length
      if (nextTabIndex < 0) {
        nextTabIndex += tabs.value.length
      }
      currentTab.value = tabs.value[nextTabIndex]!.id
      return true
    }
  }
  return false
}

export default function () {
  return {
    tabs,
    currentTab,
    sidePanelOpen,
    sidePanelHandleKeyDown,
  }
}
