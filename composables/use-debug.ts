const debugComponents = [
  'Color',
  'CommandCenter',
  'Fixtures',
  'Selection',
  'Transformer',
] as const
export type DebugComponent = typeof debugComponents[number]

type LogEntry = {
  component: DebugComponent
  logLevel: 'info' | 'error'
  timestamp: number
  messages: unknown[]
}

const logLog = shallowRef<LogEntry[]>([])

const activeInfoLoggers = ref<Record<DebugComponent, boolean>>({
  Color: true,
  CommandCenter: true,
  Fixtures: true,
  Selection: true,
  Transformer: true,
})

const debugEnabled = ref<boolean>(true)

function createInfoLogger(component: DebugComponent, throttle?: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (message: unknown, ...args: unknown[]) {
    if (!debugEnabled.value) {
      return
    }
    if (timeout !== null) {
      clearTimeout(timeout)
    }

    logLog.value = [
      ...logLog.value,
      {
        component,
        logLevel: 'error',
        timestamp: Date.now(),
        messages: [message, ...args],
      },
    ]

    if (
      debugEnabled.value
      && activeInfoLoggers.value[component]
    ) {
      timeout = setTimeout(() => {
        console.log(...toLogArgs(component, message, ...args))
        timeout = null
      }, throttle)
    }
  }
}

function logError(component: DebugComponent, message: unknown, ...args: unknown[]) {
  if (debugEnabled.value) {
    logLog.value = [
      ...logLog.value,
      {
        component,
        logLevel: 'error',
        timestamp: Date.now(),
        messages: [message, ...args],
      },
    ]
  }

  console.error(...toLogArgs(component, message, ...args))
}

function toLogArgs(debugComponent: DebugComponent, message: unknown, ...args: unknown[]): unknown[] {
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
    debugEnabled,
    logError,
    createInfoLogger,
    activeInfoLoggers,
    debugComponents: readonly(debugComponents),
    logLog: readonly(logLog),
  }
}
