import type { SGridComponent } from '../SGridComponent'
import type { ComponentEvents, SGridEvent } from './pubSubEvents'

type Filter<Component extends keyof ComponentEvents = keyof ComponentEvents> =
  Partial<Record<Component, ComponentEvents[Component][number][] | true>>

type Subscriber = {
  listener: SGridComponent
  callback: (event: SGridEvent) => void
  filter?: Filter
}

type Chain = SGridComponent[]

export class PubSub {
  private readonly subscribers = new Set<Subscriber>()
  private logger = useLogger().createLogger('PubSub')

  constructor(private pubSubOwner: SGridComponent, private readonly parent?: PubSub) {}

  subscribe(subscriber: Subscriber) {
    this.subscribers.add(subscriber)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  publish(event: SGridEvent) {
    const chain: Chain = [event.source, this.pubSubOwner]
    let numberOfReceivers = this.broadcast(event, chain)

    if (this.parent) {
      numberOfReceivers += this.parent.delegate(event, chain)
    }

    if (numberOfReceivers === 0) {
      this.logger.warn(`No listeners on event ${event.source}:${event.eventName} from PubSub:${this.pubSubOwner}`, event.data)
    }
  }

  private delegate(event: SGridEvent, chain: Chain): number {
    const newChain = [...chain, this.pubSubOwner]
    let numberOfReceivers = this.broadcast(event, newChain)
    if (this.parent) {
      numberOfReceivers += this.parent.delegate(event, newChain)
    }
    return numberOfReceivers
  }

  private broadcast(event: SGridEvent, chain: Chain): number {
    let numberOfReceivers = 0
    this.subscribers.forEach((subscriber) => {
      if (this.isSubscriberForEvent(subscriber, event)) {
        numberOfReceivers += 1
        this.logger.info(`${event.eventName}: ${chain.join(' -> ')} -> ${subscriber.listener}`, event.data)
        subscriber.callback(event)
      }
    })
    return numberOfReceivers
  }

  private isSubscriberForEvent({ filter }: Subscriber, { eventName, source: debugComponent }: SGridEvent): boolean {
    if (!filter) {
      return true
    }
    else {
      const filterEvents = filter[debugComponent]
      return !!filterEvents && (filterEvents === true || filterEvents.includes(eventName))
    }
  }
}
