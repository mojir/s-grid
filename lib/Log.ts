import type { SGridComponent } from './SGridComponent'
import { errorColor, infoColor, warnColor } from './color'
import { maxNbrOfCols, maxNbrOfRows } from './constants'
// import { getColId, getRowId, isPrimitive, jsToLits } from './utils'
import type { GridDTO } from '~/dto/GridDTO'

type LogLevel = 'info' | 'warn' | 'error'

export type LogEntry = {
  component: SGridComponent | `SGridComponent:${string}`
  tag: string | null
  logLevel: LogLevel
  timestamp: number
  messages: unknown[]

}

export class Log {
  private entries: LogEntry[] = []
  private maxEntries = maxNbrOfRows - 1
  private maxMessages = maxNbrOfCols - 4

  addEntry(entry: LogEntry) {
    this.entries.push(entry)
    if (this.entries.length > this.maxEntries) {
      this.entries.shift()
    }
  }

  toGridDTO(): GridDTO {
    const nbrOfCols = Math.min(
      this.entries.reduce((columns, entry) => entry.messages.length > columns ? entry.messages.length : columns, 1) + 4,
      maxNbrOfCols,
    )

    const gridDTO: GridDTO = {
      name: 'Log',
      nbrOfRows: this.entries.length + 1,
      nbrOfCols,
      cells: {},
    }

    gridDTO.cells.A1 = { input: 'Timestamp', bold: true }
    gridDTO.cells.B1 = { input: 'Level', bold: true }
    gridDTO.cells.C1 = { input: 'Component', bold: true }
    gridDTO.cells.D1 = { input: 'Tag', bold: true }
    gridDTO.cells.E1 = { input: 'Message', bold: true }

    this.entries.forEach((entry, rowIndex) => {
      const textColor = entry.logLevel === 'error' ? errorColor : entry.logLevel === 'warn' ? warnColor : infoColor
      const rowId = getRowId(rowIndex + 1)
      gridDTO.cells[`A${rowId}`] = {
        input: new Date(entry.timestamp).toISOString(),
        textColor,
      }
      gridDTO.cells[`B${rowId}`] = {
        input: entry.logLevel,
        textColor,
      }
      gridDTO.cells[`C${rowId}`] = {
        input: entry.component,
        textColor,
      }
      if (entry.tag) {
        gridDTO.cells[`D${rowId}`] = {
          input: entry.tag,
          textColor,
        }
      }
      entry.messages.slice(0, this.maxMessages).forEach((message, colIndex) => {
        gridDTO.cells[`${getColId(colIndex + 4)}${rowId}`] = {
          input: isPrimitive(message) ? `${message}` : `=${jsToLits(message)}`,
          textColor,
        }
      })
    })
    return gridDTO
  }
}
