import type { Mx } from '../Mx'
import type { SGridComponent } from '../SGridComponent'
import type { CellDTO } from '~/dto/CellDTO'

export const componentEvents = {
  Grid: ['rowsInserted', 'colsInserted', 'rowsRemoved', 'colsRemoved', 'cellChange', 'rowChange', 'colChange'],
  Cell: ['cellChange'],
  Row: ['rowChange'],
  Col: ['colChange'],
  Project: ['gridChange'],
} as const satisfies Partial<Record<SGridComponent, readonly string[]>>

export type ComponentEvents = typeof componentEvents

type BaseEvent<Component extends keyof ComponentEvents, EventName extends ComponentEvents[Component][number], Data> = {
  source: Component
  eventName: EventName
  data: Data & (Component extends 'Grid' | 'Row' | 'Col' | 'Cell' ? { gridName: string } : { gridName?: never })
}

export type RowsInsertedEvent = BaseEvent<
  'Grid',
  'rowsInserted',
  {
    rowIndex: number
    count: number
  }
>

export type ColsInsertedEvent = BaseEvent<
  'Grid',
  'colsInserted',
  {
    colIndex: number
    count: number
  }
>

export type RowsRemovedEvent = BaseEvent<
  'Grid',
  'rowsRemoved',
  {
    rowIndex: number
    count: number
    cells: Mx<CellDTO>
    heights: number[]
  }
>

export type ColsRemovedEvent = BaseEvent<
  'Grid',
  'colsRemoved',
  {
    colIndex: number
    count: number
    cells: Mx<CellDTO>
    widths: number[]
  }
>

export type CellChangeEvent = BaseEvent<
  'Cell',
  'cellChange',
  {
    rowIndex: number
    colIndex: number
    attribute: keyof CellDTO
    newValue: unknown
    oldValue: unknown
  }
>

export type RowChangeEvent = BaseEvent<
  'Row',
  'rowChange',
  {
    rowIndex: number
    newHeight: number
    oldHeight: number
  }
>

export type ColChangeEvent = BaseEvent<
  'Col',
  'colChange',
  {
    colIndex: number
    newWidth: number
    oldWidth: number
  }
>

export type GridChangeEvent = BaseEvent<
  'Project',
  'gridChange',
  {
    attribute: 'name'
    newValue: unknown
    oldValue: unknown
  }
>

export type SGridEvent =
  | RowsInsertedEvent
  | ColsInsertedEvent
  | RowsRemovedEvent
  | ColsRemovedEvent
  | CellChangeEvent
  | RowChangeEvent
  | ColChangeEvent
  | GridChangeEvent
