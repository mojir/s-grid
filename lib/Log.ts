import type { SGridComponent } from './SGridComponent'
import { maxNumberOfCols, maxNumberOfRows } from './constants'
import { getColId, getRowId, isPrimitive, jsToLits } from './utils'
import type { GridDTO } from '~/dto/GridDTO'

type LogLevel = 'info' | 'warn' | 'error'

export type LogEntry = {
  debugComponent: SGridComponent
  logLevel: LogLevel
  timestamp: number
  messages: unknown[]

}

export class Log {
  private entries: LogEntry[] = []
  private maxEntries = maxNumberOfRows - 1
  private maxMessages = maxNumberOfCols - 3

  addEntry(entry: LogEntry) {
    this.entries.push(entry)
    if (this.entries.length > this.maxEntries) {
      this.entries.shift()
    }
  }

  toGridDTO(): GridDTO {
    const nbrOfCols = Math.min(
      this.entries.reduce((columns, entry) => entry.messages.length > columns ? entry.messages.length : columns, 1) + 3,
      maxNumberOfCols,
    )

    const gridDTO: GridDTO = {
      name: 'Log',
      rows: this.entries.length + 1,
      cols: nbrOfCols,
      cells: {},
    }

    gridDTO.cells.A1 = { input: 'Timestamp' }
    gridDTO.cells.B1 = { input: 'Level' }
    gridDTO.cells.C1 = { input: 'Component' }
    gridDTO.cells.D1 = { input: 'Message' }

    this.entries.forEach((entry, rowIndex) => {
      const rowId = getRowId(rowIndex + 1)
      gridDTO.cells[`A${rowId}`] = {
        input: new Date(entry.timestamp).toISOString(),
      }
      gridDTO.cells[`B${rowId}`] = {
        input: entry.logLevel,
      }
      gridDTO.cells[`C${rowId}`] = {
        input: entry.debugComponent,
      }
      entry.messages.slice(0, this.maxMessages).forEach((message, colIndex) => {
        gridDTO.cells[`${getColId(colIndex + 3)}${rowId}`] = {
          input: isPrimitive(message) ? `${message}` : `=${jsToLits(message)}`,
        }
      })
    })
    return gridDTO
  }
}
