import { Log } from '~/lib/Log'
import type { SGridComponent } from '~/lib/SGridComponent'
import { sGridComponents } from '~/lib/SGridComponent'

let debugEnabled = ref(false)
const log = new Log()

const activeInfoLoggers = ref<Record<SGridComponent, boolean>>({
  Cell: false,
  Col: false,
  Color: false,
  CommandCenter: false,
  Fixtures: false,
  Grid: false,
  History: false,
  Lits: false,
  Project: false,
  PubSub: false,
  Row: false,
  Selection: false,
  Transformer: false,
  UI: false,
})

function setupRefs({ debugEnabledRef }: { debugEnabledRef: Ref<boolean> }) {
  debugEnabled = debugEnabledRef
}

function createLogger(component: SGridComponent, tag: string | null = null) {
  return {
    withTag: (newTag: string) => createLogger(component, newTag),
    info: (message: unknown, ...args: unknown[]) => {
      if (debugEnabled.value && activeInfoLoggers.value[component]) {
        log.addEntry({
          component,
          tag,
          logLevel: 'info',
          timestamp: Date.now(),
          messages: [message, ...args],
        })

        console.log(...toLogArgs(component, tag, message, ...args))
      }
    },

    throttleInfo: (() => {
      let timeout: ReturnType<typeof setTimeout> | null = null

      return function (message: unknown, ...args: unknown[]) {
        if (!debugEnabled.value) {
          return
        }

        if (timeout !== null) {
          clearTimeout(timeout)
          timeout = null
        }

        timeout = setTimeout(() => {
          if (debugEnabled.value && activeInfoLoggers.value[component]) {
            log.addEntry({
              component,
              tag,
              logLevel: 'info',
              timestamp: Date.now(),
              messages: [message, ...args],
            })

            console.log(...toLogArgs(component, tag, message, ...args))
          }

          timeout = null
        }, 500)
      }
    })(),

    warn: (message: unknown, ...args: unknown[]) => {
      log.addEntry({
        component,
        tag,
        logLevel: 'warn',
        timestamp: Date.now(),
        messages: [message, ...args],
      })

      if (debugEnabled.value) {
        console.warn(...toLogArgs(component, tag, message, ...args))
      }
    },

    error: (message: unknown, ...args: unknown[]) => {
      log.addEntry({
        component,
        tag,
        logLevel: 'error',
        timestamp: Date.now(),
        messages: [message, ...args],
      })

      console.error(...toLogArgs(component, tag, message, ...args))
    },
  }
}
function toLogArgs(component: SGridComponent, tag: string | null, message: unknown, ...args: unknown[]): unknown[] {
  const prefix = tag ? `${component}:${tag}` : component
  return (typeof message === 'string' && message.includes('\n'))
    ? [
        `[${prefix}]\n${message}`,
        ...args,
      ]
    : [
        `[${prefix}]`,
        message,
        ...args,
      ]
}

export default function () {
  return {
    setupRefs,
    createLogger,
    getLogGridDTO: () => log.toGridDTO(),
    activeInfoLoggers,
    sGridComponents: readonly(sGridComponents),
    log: readonly(log),
  }
}
