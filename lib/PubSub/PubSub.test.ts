import { describe, it, expect, vi } from 'vitest'
import type { SGridEvent } from './pubSubEvents'
import { PubSub } from './index'

describe('PubSub', () => {
  it('should subscribe and publish events', () => {
    const pubSub = new PubSub('Project')
    const callback = vi.fn()
    const event: SGridEvent = {
      source: 'Grid',
      eventName: 'rowsInserted',
      data: { rowIndex: 1, count: 2, gridName: 'Grid1' },
    }

    const unsubscribe = pubSub.subscribe({ listener: 'CommandCenter', callback, filter: { Grid: ['rowsInserted'] } })
    pubSub.publish(event)

    expect(callback).toHaveBeenCalledWith(event)
    unsubscribe()
  })

  it('should not call callback for unsubscribed events', () => {
    const pubSub = new PubSub('Project')
    const callback = vi.fn()
    const event: SGridEvent = {
      source: 'Grid',
      eventName: 'rowsInserted',
      data: { rowIndex: 1, count: 2, gridName: 'Grid1' },
    }

    pubSub.subscribe({ listener: 'CommandCenter', callback, filter: { Grid: ['colsInserted'] } })
    pubSub.publish(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should unsubscribe correctly', () => {
    const pubSub = new PubSub('Project')
    const callback = vi.fn()
    const event: SGridEvent = {
      source: 'Grid',
      eventName: 'rowsInserted',
      data: { rowIndex: 1, count: 2, gridName: 'Grid1' },
    }

    const unsubscribe = pubSub.subscribe({ listener: 'CommandCenter', callback, filter: { Grid: ['rowsInserted'] } })
    unsubscribe()
    pubSub.publish(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should publish events to parent PubSub', () => {
    const parentPubSub = new PubSub('Project')
    const childPubSub = new PubSub('Grid', parentPubSub)
    const callback = vi.fn()
    const event: SGridEvent = {
      source: 'Grid',
      eventName: 'rowsInserted',
      data: { rowIndex: 1, count: 2, gridName: 'Grid1' },

    }

    parentPubSub.subscribe({ listener: 'CommandCenter', callback, filter: { Grid: ['rowsInserted'] } })
    childPubSub.publish(event)

    expect(callback).toHaveBeenCalledWith(event)
  })

  it('should not call parent callback for unsubscribed events', () => {
    const parentPubSub = new PubSub('Project')
    const childPubSub = new PubSub('Grid', parentPubSub)
    const callback = vi.fn()
    const event: SGridEvent = {
      source: 'Grid',
      eventName: 'rowsInserted',
      data: { rowIndex: 1, count: 2, gridName: 'Grid1' },
    }
    parentPubSub.subscribe({ listener: 'CommandCenter', callback, filter: { Grid: ['colsInserted'] } })
    childPubSub.publish(event)

    expect(callback).not.toHaveBeenCalled()
  })
})
