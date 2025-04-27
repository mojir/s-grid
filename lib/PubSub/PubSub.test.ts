import { describe, it, expect, vi } from 'vitest'
import type { SGridEvent } from './pubSubEvents'
import { PubSub } from './index'

describe('PubSub', () => {
  it('should subscribe and publish events', () => {
    const pubSub = new PubSub()
    const callback = vi.fn()
    const event: SGridEvent = {
      type: 'Change',
      eventName: 'rowsInserted',
      data: { rowIndex: 1, count: 2, gridName: 'Grid1' },
    }

    const unsubscribe = pubSub.subscribe({ callback, filter: { Change: ['rowsInserted'] } })
    pubSub.publish(event)

    expect(callback).toHaveBeenCalledWith(event)
    unsubscribe()
  })

  it('should not call callback for unsubscribed events', () => {
    const pubSub = new PubSub()
    const callback = vi.fn()
    const event: SGridEvent = {
      type: 'Change',
      eventName: 'rowsInserted',
      data: { rowIndex: 1, count: 2, gridName: 'Grid1' },
    }

    pubSub.subscribe({ callback, filter: { Change: ['colsInserted'] } })
    pubSub.publish(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should unsubscribe correctly', () => {
    const pubSub = new PubSub()
    const callback = vi.fn()
    const event: SGridEvent = {
      type: 'Change',
      eventName: 'rowsInserted',
      data: { rowIndex: 1, count: 2, gridName: 'Grid1' },
    }

    const unsubscribe = pubSub.subscribe({ callback, filter: { Change: ['rowsInserted'] } })
    unsubscribe()
    pubSub.publish(event)

    expect(callback).not.toHaveBeenCalled()
  })
})
