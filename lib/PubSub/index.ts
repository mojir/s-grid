import type { SGridEvent } from './pubSubEvents'

type Subscriber = {
  callback: (event: SGridEvent) => void
  eventTypes: SGridEvent['type'][] | null
}

export class PubSub {
  private readonly subscribers = new Set<Subscriber>()

  constructor(private readonly parent: PubSub | null = null) {}

  subscribe(callback: Subscriber['callback'], ...eventTypes: NonNullable<Subscriber['eventTypes']>) {
    const subscriber: Subscriber = {
      callback,
      eventTypes: eventTypes.length ? eventTypes : null,
    }

    this.subscribers.add(subscriber)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  publish(event: SGridEvent) {
    this.subscribers.forEach((subscriber) => {
      if (subscriber.eventTypes && !subscriber.eventTypes.includes(event.type)) {
        return
      }
      subscriber.callback(event)
    })
    if (this.parent) {
      this.parent.publish(event)
    }
  }
}
