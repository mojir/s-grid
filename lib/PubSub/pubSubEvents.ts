import type { Mx } from '../Mx'
import type { CellDTO } from '~/dto/CellDTO'

type BaseEvent<T extends string, C extends 'Grid' | 'Global', D> = {
  type: T
  data: D
} & (C extends 'Grid' ? { gridName: string } : { gridName?: never })

export type RowsInsertedEvent = BaseEvent<
  'rowsInserted',
  'Grid',
  {
    rowIndex: number
    count: number
  }
>

export type ColsInsertedEvent = BaseEvent<
  'colsInserted',
  'Grid',
  {
    colIndex: number
    count: number
  }
>

export type RowsRemovedEvent = BaseEvent<
  'rowsRemoved',
  'Grid',
  {
    rowIndex: number
    count: number
    deletedRows: Mx<CellDTO>
  }
>

export type ColsRemovedEvent = BaseEvent<
  'colsRemoved',
  'Grid',
  {
    colIndex: number
    count: number
    deletedCols: Mx<CellDTO>
  }
>

export type CellChangeEvent = BaseEvent<
  'cellChange',
  'Grid',
  {
    rowIndex: number
    colIndex: number
    attribute: keyof CellDTO
    oldValue: unknown
    newValue: unknown
  }
>

export type RowChangeEvent = BaseEvent<
  'rowChange',
  'Grid',
  {
    rowIndex: number
    oldValue: number
    newValue: number
  }
>

export type ColChangeEvent = BaseEvent<
  'colChange',
  'Grid',
  {
    colIndex: number
    oldValue: number
    newValue: number
  }
>

export type GridChangeEvent = BaseEvent<
  'gridChange',
  'Global',
  {
    attribute: 'name'
    oldValue: unknown
    newValue: unknown
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
