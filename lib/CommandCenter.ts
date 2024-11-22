import type { JsFunction } from '@mojir/lits'
import type { CellLocator } from './locator/CellLocator'
import { getColNumber, type ColRange } from './locator/ColLocator'
import { getRowNumber, type RowRange } from './locator/RowLocator'
import type { Direction } from './locator/utils'
import { validCellStyle, type CellStyle, type CellStyleName } from '~/lib/CellStyle'
import { Color } from '~/lib/color'
import type { GridProject } from '~/lib/GridProject'
import { format } from '~/lib/litsInterop/format'

const commandNames = [
  'Clear!',
  'ClearAllCells!',
  'ClearRepl!',
  'CreateNamedFunction!',
  'DeleteCols!',
  'DeleteRows!',
  'ExpandSelection!',
  'ExpandSelectionTo!',
  'GetCell',
  'GetCells',
  'GetSelection',
  'Help',
  'InsertColsAfter!',
  'InsertColsBefore!',
  'InsertRowsAfter!',
  'InsertRowsBefore!',
  'MovePosition!',
  'MovePositionTo!',
  'ResetSelection!',
  'RestartRepl!',
  'Select!',
  'SetAlias!',
  'SetBackgroundColor!',
  'SetColWidth!',
  'SetFormatter!',
  'SetInput!',
  'SetRowHeight!',
  'SetStyle!',
  'SetTextColor!',
] as const

type BuiltinCommandName = typeof commandNames[number]

type Command<T extends string> = {
  name: T
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => unknown
}

export class CommandCenter {
  public commands = new Map<string, Command<string>>()
  public jsFunctions: Record<string, JsFunction> = {
    format,
  }

  public constructor(private gridProject: GridProject) {
    this.registerCommands()
    commandNames.forEach((name) => {
      if (!this.commands.has(name)) {
        throw Error(`Command ${name} not registered`)
      }
    })
  }

  private registerCommand(command: Command<BuiltinCommandName>) {
    this.commands.set(command.name, command)
    this.jsFunctions[command.name] = { fn: (...args: unknown[]) => this.exec(command.name, ...args) }
  }

  public exec(name: BuiltinCommandName, ...args: unknown[]) {
    const command = this.commands.get(name)
    if (!command) {
      console.error(`Command ${name} not found`)
      return
    }
    return command.execute(...args)
  }

  private registerCommands() {
    const repl = this.gridProject.repl

    this.registerCommand({
      name: 'CreateNamedFunction!',
      execute: (alias: string, input: string, target?: string) => {
        const grid = this.gridProject.currentGrid
        const cell = grid.value.getCell(target)
        grid.value.alias.setCell(alias, cell)
        grid.value.setInput(input, target)
      },
      description: 'Clear the current cell',
    })

    this.registerCommand({
      name: 'SetRowHeight!',
      execute: (height: number, target?: string) => {
        const grid = this.gridProject.currentGrid
        const cell = grid.value.getCell(target)
        grid.value.getRow(cell.cellLocator.getRowLocator()).height.value = height
      },
      description: 'Set row height',
    })

    this.registerCommand({
      name: 'SetColWidth!',
      execute: (width: number, target?: string) => {
        const grid = this.gridProject.currentGrid
        const cell = grid.value.getCell(target)
        grid.value.getCol(cell.cellLocator.getColLocator()).width.value = width
      },
      description: 'Set column width',
    })

    this.registerCommand({
      name: 'MovePosition!',
      execute: (direction: Direction) => {
        const grid = this.gridProject.currentGrid
        grid.value.movePosition(direction)
      },
      description: 'Move the position one step in a specific direction.',
    })
    this.registerCommand({
      name: 'MovePositionTo!',
      execute: (cell: string) => {
        const grid = this.gridProject.currentGrid
        grid.value.movePositionTo(cell)
      },
      description: 'Move the position to a specific cell',
    })
    this.registerCommand({
      name: 'SetInput!',
      execute: (input: string, target?: string) => {
        const grid = this.gridProject.currentGrid
        grid.value.setInput(input, target)
      },
      description: 'Set the input of a cell or a range of cells. If no target is specified, set input of all cells in the current selection.',
    })
    this.registerCommand({
      name: 'Clear!',
      execute: (target?: string) => {
        const grid = this.gridProject.currentGrid
        grid.value.clear(target)
      },
      description: 'Clear a cell or a range of cells. If no target is specified, clear the current selection.',
    })
    this.registerCommand({
      name: 'ClearAllCells!',
      execute: () => {
        const grid = this.gridProject.currentGrid
        grid.value.clearAllCells()
      },
      description: 'Clear all cells',
    })
    this.registerCommand({
      name: 'GetCell',
      execute: (cellLocator: string) => {
        const grid = this.gridProject.currentGrid
        return grid.value.getCell(cellLocator).getDebugInfo()
      },
      description: 'Get a cell. If no target is specified, get the active cell.',
    })
    this.registerCommand({
      name: 'GetCells',
      execute: (cellLocator: string) => {
        const grid = this.gridProject.currentGrid
        return grid.value.getCells(cellLocator).map(cell => cell.getDebugInfo())
      },
      description: 'Get array of cells. If no target is specified, get all cells in the current selection.',
    })
    this.registerCommand({
      name: 'SetAlias!',
      execute: (alias: string, id?: string) => {
        const grid = this.gridProject.currentGrid
        const cell = grid.value.getCell(id)
        grid.value.alias.setCell(alias, cell)
      },
      description: 'Create an alias for a cell',
    })

    this.registerCommand({
      name: 'SetStyle!',
      execute: <T extends CellStyleName>(property: T, value: CellStyle[T], cellLocator?: string) => {
        if (validCellStyle(property, value)) {
          const grid = this.gridProject.currentGrid
          grid.value.setStyle(property, value, cellLocator)
        }
        else {
          throw new Error(`Invalid cell style property: ${property}`)
        }
      },
      description: 'Set the style of a cell or a range of cells. If no target is specified, set the style of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetBackgroundColor!',
      execute: (hexCode: string, target?: string) => {
        const color = Color.fromHex(hexCode)
        const grid = this.gridProject.currentGrid
        grid.value.setBackgroundColor(color, target)
      },
      description: 'Set the background color of a cell or a range of cells. If no target is specified, set the background color of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetTextColor!',
      execute: (hexCode: string, target?: string) => {
        const color = Color.fromHex(hexCode)
        const grid = this.gridProject.currentGrid
        grid.value.setTextColor(color, target)
      },
      description: 'Set the text color of a cell or a range of cells. If no target is specified, set the text color of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetFormatter!',
      execute: (formatter: string, target?: string) => {
        const grid = this.gridProject.currentGrid
        grid.value.setFormatter(formatter, target)
      },
      description: 'Set the formatter program of a cell or a range of cells. If no target is specified, set the formatter program of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'ResetSelection!',
      execute: () => {
        const grid = this.gridProject.currentGrid
        grid.value.resetSelection()
      },
      description: 'Reset the selection',
    })

    this.registerCommand({
      name: 'GetSelection',
      execute: () => this.gridProject.currentGrid.value.selection.selectedRange.value.toString(),
      description: 'Get the current selection.',
    })

    this.registerCommand({
      name: 'ExpandSelection!',
      execute: (direction: Direction) => {
        const grid = this.gridProject.currentGrid
        grid.value.selection.expandSelection(direction)
      },
      description: 'Expand the selection one step in a specific direction',
    })

    this.registerCommand({
      name: 'ExpandSelectionTo!',
      execute: (target: CellLocator | string) => {
        const grid = this.gridProject.currentGrid
        grid.value.selection.expandSelectionTo(target)
      },
      description: 'Expand the selection to a cell',
    })

    this.registerCommand({
      name: 'Select!',
      execute: (target: string) => {
        const grid = this.gridProject.currentGrid
        grid.value.selection.select(target)
      },
      description: 'Select a cell or a range',
    })

    this.registerCommand({
      name: 'ClearRepl!',
      description: 'Clear the Repl history',
      execute: () => {
        repl.clearRepl()
      },
    })

    this.registerCommand({
      name: 'RestartRepl!',
      description: 'Clear the Repl Lits context',
      execute: () => {
        repl.restartRepl()
        return 'Repl context cleared'
      },
    })

    this.registerCommand({
      name: 'Help',
      description: 'Get the list of available commands',
      execute: (topic?: string): string => {
        return repl.getHelp(topic)
      },
    })

    this.registerCommand({
      name: 'DeleteRows!',
      description: 'Delete rows',
      execute: (startRowStringId: string, endRowStringId?: string) => {
        const startRowIndex = getRowNumber(startRowStringId)
        const endRowIndex = endRowStringId ? getRowNumber(endRowStringId) : startRowIndex
        const rowIndex = Math.min(startRowIndex, endRowIndex)
        const count = Math.abs(endRowIndex - startRowIndex) + 1
        const rowRange: RowRange = {
          row: rowIndex,
          count,
        }
        const grid = this.gridProject.currentGrid
        grid.value.deleteRows(rowRange)
      },
    })

    this.registerCommand({
      name: 'DeleteCols!',
      description: 'Delete cols',
      execute: (startColStringId: string, endColStringId?: string) => {
        const startColIndex = getColNumber(startColStringId)
        const endColIndex = endColStringId ? getColNumber(endColStringId) : startColIndex
        const colIndex = Math.min(startColIndex, endColIndex)
        const count = Math.abs(endColIndex - startColIndex) + 1
        const colRange: ColRange = {
          col: colIndex,
          count,
        }
        const grid = this.gridProject.currentGrid
        grid.value.deleteCols(colRange)
      },
    })

    this.registerCommand({
      name: 'InsertRowsBefore!',
      description: 'Insert rows before',
      execute: (startRowStringId: string, endRowStringId?: string) => {
        const startRowIndex = getRowNumber(startRowStringId)
        const endRowIndex = endRowStringId ? getRowNumber(endRowStringId) : startRowIndex
        const rowIndex = Math.min(startRowIndex, endRowIndex)
        const count = Math.abs(endRowIndex - startRowIndex) + 1
        const rowRange: RowRange = {
          row: rowIndex,
          count,
        }
        const grid = this.gridProject.currentGrid
        grid.value.insertRowsBefore(rowRange)
      },
    })

    this.registerCommand({
      name: 'InsertRowsAfter!',
      description: 'Insert rows before',
      execute: (startRowStringId: string, endRowStringId?: string) => {
        const startRowIndex = getRowNumber(startRowStringId)
        const endRowIndex = endRowStringId ? getRowNumber(endRowStringId) : startRowIndex
        const rowIndex = Math.min(startRowIndex, endRowIndex)
        const count = Math.abs(endRowIndex - startRowIndex) + 1
        const rowRange: RowRange = {
          row: rowIndex,
          count,
        }
        const grid = this.gridProject.currentGrid
        grid.value.insertRowsAfter(rowRange)
      },
    })

    this.registerCommand({
      name: 'InsertColsBefore!',
      description: 'Insert columns before',
      execute: (startColStringId: string, endColStringId?: string) => {
        const startColIndex = getColNumber(startColStringId)
        const endColIndex = endColStringId ? getColNumber(endColStringId) : startColIndex
        const colIndex = Math.min(startColIndex, endColIndex)
        const count = Math.abs(endColIndex - startColIndex) + 1
        const colRange: ColRange = {
          col: colIndex,
          count,
        }
        const grid = this.gridProject.currentGrid
        grid.value.insertColsBefore(colRange)
      },
    })

    this.registerCommand({
      name: 'InsertColsAfter!',
      description: 'Insert columns before',
      execute: (startColStringId: string, endColStringId?: string) => {
        const startColIndex = getColNumber(startColStringId)
        const endColIndex = endColStringId ? getColNumber(endColStringId) : startColIndex
        const colIndex = Math.min(startColIndex, endColIndex)
        const count = Math.abs(endColIndex - startColIndex) + 1
        const colRange: ColRange = {
          col: colIndex,
          count,
        }
        const grid = this.gridProject.currentGrid
        grid.value.insertColsAfter(colRange)
      },
    })
  }
}