import { Log } from '~/lib/Log'
import type { SGridComponent } from '~/lib/SGridComponent'
import { sGridComponents } from '~/lib/SGridComponent'

const { debugEnabled } = useDebug()

const log = new Log()

const activeInfoLoggers = ref<Record<SGridComponent, boolean>>({
  Cell: false,
  Col: false,
  Color: false,
  CommandCenter: false,
  Fixtures: false,
  Grid: false,
  History: false,
  Project: false,
  PubSub: false,
  Row: false,
  Selection: false,
  Transformer: false,
  UI: false,
})

function createLogger(component: SGridComponent, infoThrottle = 500) {
  return {
    info: (message: unknown, ...args: unknown[]) => {
      if (debugEnabled.value && activeInfoLoggers.value[component]) {
        log.addEntry({
          debugComponent: component,
          logLevel: 'info',
          timestamp: Date.now(),
          messages: [message, ...args],
        })

        console.log(...toLogArgs(component, message, ...args))
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
              debugComponent: component,
              logLevel: 'info',
              timestamp: Date.now(),
              messages: [message, ...args],
            })

            console.log(...toLogArgs(component, message, ...args))
          }

          timeout = null
        }, infoThrottle)
      }
    })(),

    warn: (message: unknown, ...args: unknown[]) => {
      log.addEntry({
        debugComponent: component,
        logLevel: 'warn',
        timestamp: Date.now(),
        messages: [message, ...args],
      })

      if (debugEnabled.value) {
        console.warn(...toLogArgs(component, message, ...args))
      }
    },

    error: (message: unknown, ...args: unknown[]) => {
      log.addEntry({
        debugComponent: component,
        logLevel: 'error',
        timestamp: Date.now(),
        messages: [message, ...args],
      })

      console.error(...toLogArgs(component, message, ...args))
    },
  }
}
function toLogArgs(debugComponent: SGridComponent, message: unknown, ...args: unknown[]): unknown[] {
  return (typeof message === 'string' && message.includes('\n'))
    ? [
        `[${debugComponent}]\n${message}`,
        ...args,
      ]
    : [
        `[${debugComponent}]`,
        message,
        ...args,
      ]
}

export default function () {
  return {
    createLogger,
    getLogGridDTO: () => log.toGridDTO(),
    activeInfoLoggers,
    debugComponents: readonly(sGridComponents),
    log: readonly(log),
  }
}
