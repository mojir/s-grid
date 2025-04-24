import type { Mx } from '../Mx'
import type { EventType } from '.'
import type { CellDTO } from '~/dto/CellDTO'

export const pubSubEvents = {
  Change: ['rowsInserted', 'colsInserted', 'rowsRemoved', 'colsRemoved', 'cellChange', 'rowChange', 'colChange', 'cellChange', 'rowChange', 'colChange', 'gridChange'],
  Alert: ['success', 'error', 'warning'],
} as const satisfies Partial<Record<EventType, readonly string[]>>

export type PubSubEvents = typeof pubSubEvents

type BaseEvent<EventType extends keyof PubSubEvents, EventName extends PubSubEvents[EventType][number], Data> = {
  type: EventType
  eventName: EventName
  data: Data
}

export type AlertEvent<T extends 'success' | 'error' | 'warning'> = BaseEvent<
  'Alert',
  T,
  {
    gridName: string
    rowIndex: number
    count: number
  }
>

export type RowsInsertedEvent = BaseEvent<
  'Change',
  'rowsInserted',
  {
    gridName: string
    rowIndex: number
    count: number
  }
>

export type ColsInsertedEvent = BaseEvent<
  'Change',
  'colsInserted',
  {
    gridName: string
    colIndex: number
    count: number
  }
>

export type RowsRemovedEvent = BaseEvent<
  'Change',
  'rowsRemoved',
  {
    gridName: string
    rowIndex: number
    count: number
    cells: Mx<CellDTO>
    heights: number[]
  }
>

export type ColsRemovedEvent = BaseEvent<
  'Change',
  'colsRemoved',
  {
    gridName: string
    colIndex: number
    count: number
    cells: Mx<CellDTO>
    widths: number[]
  }
>

export type CellChangeEvent = BaseEvent<
  'Change',
  'cellChange',
  {
    gridName: string
    rowIndex: number
    colIndex: number
    attribute: keyof CellDTO
    newValue: unknown
    oldValue: unknown
  }
>

export type RowChangeEvent = BaseEvent<
  'Change',
  'rowChange',
  {
    gridName: string
    rowIndex: number
    newHeight: number
    oldHeight: number
  }
>

export type ColChangeEvent = BaseEvent<
  'Change',
  'colChange',
  {
    gridName: string
    colIndex: number
    newWidth: number
    oldWidth: number
  }
>

export type GridChangeEvent = BaseEvent<
  'Change',
  'gridChange',
  {
    attribute: 'name'
    newValue: unknown
    oldValue: unknown
  }
>

export type ChangeEvent =
  | RowsInsertedEvent
  | ColsInsertedEvent
  | RowsRemovedEvent
  | ColsRemovedEvent
  | CellChangeEvent
  | RowChangeEvent
  | ColChangeEvent
  | GridChangeEvent

export type SGridEvent =
  | ChangeEvent
  | AlertEvent<'success'>
  | AlertEvent<'error'>
  | AlertEvent<'warning'>
