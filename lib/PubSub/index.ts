import type { PubSubEvents, SGridEvent } from './pubSubEvents'

export type EventType = 'Change' | 'Alert'
type Filter<Component extends keyof PubSubEvents = keyof PubSubEvents> =
  Partial<Record<Component, PubSubEvents[Component][number][] | true>>

type Subscriber = {
  callback: (event: SGridEvent) => void
  filter?: Filter
}

export class PubSub {
  private readonly subscribers = new Set<Subscriber>()
  private logger = useLogger().createLogger('PubSub')

  subscribe(subscriber: Subscriber) {
    this.subscribers.add(subscriber)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  publish(event: SGridEvent) {
    const numberOfReceivers = this.broadcast(event)

    if (numberOfReceivers === 0) {
      this.logger.warn(`No listeners on event ${event.type}:${event.eventName}`, event.data)
    }
  }

  private broadcast(event: SGridEvent): number {
    let numberOfReceivers = 0
    this.subscribers.forEach((subscriber) => {
      if (this.isSubscriberForEvent(subscriber, event)) {
        numberOfReceivers += 1
        subscriber.callback(event)
      }
    })
    return numberOfReceivers
  }

  private isSubscriberForEvent({ filter }: Subscriber, { eventName, type }: SGridEvent): boolean {
    if (!filter) {
      return true
    }
    else {
      const filterEvents = filter[type]
      return !!filterEvents && (filterEvents === true || filterEvents.includes(eventName))
    }
  }
}
