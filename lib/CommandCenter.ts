import type { JsFunction } from '@mojir/lits'
import { CellLocator } from './locators/CellLocator'
import { ColLocator, isColLocatorString } from './locators/ColLocator'
import { isRowLocatorString, RowLocator } from './locators/RowLocator'
import { getReferenceLocatorFromString, type Direction } from './locators/utils'
import { isRowRangeLocatorString, RowRangeLocator } from './locators/RowRangeLocator'
import { ColRangeLocator, isColRangeLocatorString } from './locators/ColRangeLocator'
import { getColNumber, getRowNumber } from './utils'
import { Color } from '~/lib/color'
import type { Project } from '~/lib/project/Project'
import { format } from '~/lib/litsInterop/format'
import { isFontSize, isStyleAlign, isStyleJustify, isStyleTextDecoration } from '~/dto/CellDTO'

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
  'GetCell',
  'GetSelection',
  'Help',
  'InsertColsAfter!',
  'InsertColsBefore!',
  'InsertRowsAfter!',
  'InsertRowsBefore!',
  'MovePosition!',
  'MovePositionTo!',
  'Redo!',
  'ResetSelection!',
  'RestartRepl!',
  'Select!',
  'SetAlias!',
  'SetBackgroundColor!',
  'SetColWidth!',
  'SetFormatter!',
  'SetInput!',
  'SetRowHeight!',
  'SetFontSize!',
  'SetBold!',
  'SetItalic!',
  'SetTextDecoration!',
  'SetJustify!',
  'SetAlign!',
  'SetTextColor!',
  'Undo!',
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

  public constructor(private project: Project) {}

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

  public registerCommands() {
    const repl = this.project.repl

    this.registerCommand({
      name: 'CreateNamedFunction!',
      execute: (alias: string, input: string, cellLocatorString?: string) => {
        const grid = this.project.currentGrid
        const locator = (cellLocatorString && CellLocator.fromString(grid.value, cellLocatorString)) || grid.value.position.value
        this.project.aliases.setCell(alias, locator)
        grid.value.setInput(input, locator)
      },
      description: 'Clear the current cell',
    })

    this.registerCommand({
      name: 'SetRowHeight!',
      execute: (height: number, locatorString?: string) => {
        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setRowHeight(height, null)
          return
        }
        const rowRangeLocator: RowRangeLocator | undefined = isRowRangeLocatorString(locatorString)
          ? RowRangeLocator.fromString(grid.value, locatorString)
          : isRowLocatorString(locatorString)
            ? RowRangeLocator.fromRowLocators(
                RowLocator.fromString(grid.value, locatorString),
                RowLocator.fromString(grid.value, locatorString),
              )
            : undefined

        if (!rowRangeLocator) {
          throw new Error(`Invalid row locator: ${locatorString}`)
        }
        grid.value.setRowHeight(height, rowRangeLocator)
      },
      description: 'Set row height',
    })

    this.registerCommand({
      name: 'SetColWidth!',
      execute: (width: number, locatorString?: string) => {
        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setColWidth(width, null)
          return
        }

        const colRangeLocator: ColRangeLocator | undefined = isColRangeLocatorString(locatorString)
          ? ColRangeLocator.fromString(grid.value, locatorString)
          : isColLocatorString(locatorString)
            ? ColRangeLocator.fromColLocators(
                ColLocator.fromString(grid.value, locatorString),
                ColLocator.fromString(grid.value, locatorString),
              )
            : undefined

        if (!colRangeLocator) {
          throw new Error(`Invalid col locator: ${locatorString}`)
        }
        grid.value.setColWidth(width, colRangeLocator)
      },
      description: 'Set column width',
    })

    this.registerCommand({
      name: 'MovePosition!',
      execute: (direction: Direction) => {
        const grid = this.project.currentGrid
        grid.value.movePosition(direction)
      },
      description: 'Move the position one step in a specific direction.',
    })
    this.registerCommand({
      name: 'MovePositionTo!',
      execute: (cellLocatorString: string) => {
        const grid = this.project.currentGrid
        const cellLocator = CellLocator.fromString(grid.value, cellLocatorString)
        grid.value.movePositionTo(cellLocator)
      },
      description: 'Move the position to a specific cell',
    })
    this.registerCommand({
      name: 'SetInput!',
      execute: (input: string, locatorString?: string) => {
        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setInput(input, null)
          return
        }
        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setInput(input, locator)
      },
      description: 'Set the input of a cell or a range of cells. If no target is specified, set input of all cells in the current selection.',
    })
    this.registerCommand({
      name: 'Clear!',
      execute: (locatorString?: string) => {
        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.clear(null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.clear(locator)
      },
      description: 'Clear a cell or a range of cells. If no target is specified, clear the current selection.',
    })
    this.registerCommand({
      name: 'ClearAllCells!',
      execute: () => {
        const grid = this.project.currentGrid
        grid.value.clearAllCells()
      },
      description: 'Clear all cells',
    })
    this.registerCommand({
      name: 'GetCell',
      execute: (cellLocatorString: string) => {
        const grid = this.project.currentGrid
        const cellLocator = CellLocator.fromString(grid.value, cellLocatorString)
        return this.project.locator.getCellFromLocator(cellLocator).getDebugInfo()
      },
      description: 'Get a cell. If no target is specified, get the active cell.',
    })
    this.registerCommand({
      name: 'GetCell',
      execute: (cellLocatorString: string) => {
        const grid = this.project.currentGrid
        const cellLocator = CellLocator.fromString(grid.value, cellLocatorString)
        return this.project.locator.getCellFromLocator(cellLocator).getDebugInfo()
      },
      description: 'Get array of cells. If no target is specified, get all cells in the current selection.',
    })
    this.registerCommand({
      name: 'SetAlias!',
      execute: (alias: string, cellLocatorString?: string) => {
        const grid = this.project.currentGrid
        const cellLocator = (cellLocatorString && CellLocator.fromString(grid.value, cellLocatorString)) || grid.value.position.value
        this.project.aliases.setCell(alias, cellLocator)
      },
      description: 'Create an alias for a cell',
    })

    this.registerCommand({
      name: 'SetFontSize!',
      execute: (fontSize: number, locatorString?: string) => {
        if (!isFontSize(fontSize)) {
          throw new Error(`Invalid font size: ${fontSize}`)
        }
        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setFontSize(fontSize, null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setFontSize(fontSize, locator)
      },
      description: 'Set the font size of a cell or a range of cells. If no target is specified, set the font size of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetBold!',
      execute: (value: boolean, locatorString?: string) => {
        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setBold(value, null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setBold(value, locator)
      },
      description: 'Set the bold of a cell or a range of cells. If no target is specified, set the bold of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetItalic!',
      execute: (value: boolean, locatorString?: string) => {
        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setItalic(value, null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setItalic(value, locator)
      },
      description: 'Set the italic of a cell or a range of cells. If no target is specified, set the italic of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetTextDecoration!',
      execute: (value: string, locatorString?: string) => {
        if (!isStyleTextDecoration(value)) {
          throw new Error(`Invalid text decoration: ${value}`)
        }

        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setTextDecoration(value, null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setTextDecoration(value, locator)
      },
      description: 'Set the text decoration of a cell or a range of cells. If no target is specified, set the text decoration of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetJustify!',
      execute: (value: string, locatorString?: string) => {
        if (!isStyleJustify(value)) {
          throw new Error(`Invalid justify: ${value}`)
        }

        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setJustify(value, null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setJustify(value, locator)
      },
      description: 'Set the justify of a cell or a range of cells. If no target is specified, set the justify of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetAlign!',
      execute: (value: string, locatorString?: string) => {
        if (!isStyleAlign(value)) {
          throw new Error(`Invalid align: ${value}`)
        }

        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setAlign(value, null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setAlign(value, locator)
      },
      description: 'Set the align of a cell or a range of cells. If no target is specified, set the align of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetBackgroundColor!',
      execute: (hexCode: string, locatorString?: string) => {
        const grid = this.project.currentGrid
        const color = Color.fromHex(hexCode)
        if (!locatorString) {
          grid.value.setBackgroundColor(color, null)
          return
        }
        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setBackgroundColor(color, locator)
      },
      description: 'Set the background color of a cell or a range of cells. If no target is specified, set the background color of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetTextColor!',
      execute: (hexCode: string, locatorString?: string) => {
        const grid = this.project.currentGrid
        const color = Color.fromHex(hexCode)
        if (!locatorString) {
          grid.value.setTextColor(color, null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }

        grid.value.setTextColor(color, locator)
      },
      description: 'Set the text color of a cell or a range of cells. If no target is specified, set the text color of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetFormatter!',
      execute: (formatter: string, locatorString?: string) => {
        const grid = this.project.currentGrid
        if (!locatorString) {
          grid.value.setFormatter(formatter, null)
          return
        }

        const locator = getReferenceLocatorFromString(grid.value, locatorString)
        if (!locator) {
          throw new Error(`Invalid locator: ${locatorString}`)
        }
        grid.value.setFormatter(formatter, locator)
      },
      description: 'Set the formatter program of a cell or a range of cells. If no target is specified, set the formatter program of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'ResetSelection!',
      execute: () => {
        const grid = this.project.currentGrid
        grid.value.resetSelection()
      },
      description: 'Reset the selection',
    })

    this.registerCommand({
      name: 'GetSelection',
      execute: () => this.project.currentGrid.value.selection.selectedRange.value.toStringWithGrid(),
      description: 'Get the current selection.',
    })

    this.registerCommand({
      name: 'ExpandSelection!',
      execute: (direction: Direction) => {
        const grid = this.project.currentGrid
        grid.value.selection.expandSelection(direction)
      },
      description: 'Expand the selection one step in a specific direction',
    })

    this.registerCommand({
      name: 'ExpandSelectionTo!',
      execute: (target: CellLocator | string) => {
        const grid = this.project.currentGrid
        grid.value.selection.expandSelectionTo(target)
      },
      description: 'Expand the selection to a cell',
    })

    this.registerCommand({
      name: 'Select!',
      execute: (target: string) => {
        const grid = this.project.currentGrid
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
        const grid = this.project.currentGrid
        const startRowIndex = getRowNumber(startRowStringId)
        const endRowIndex = endRowStringId ? getRowNumber(endRowStringId) : startRowIndex
        const startRow = Math.min(startRowIndex, endRowIndex)
        const endRow = Math.max(startRowIndex, endRowIndex)
        const rowRangeLocator = RowRangeLocator.fromRowLocators(
          RowLocator.fromNumber(grid.value, startRow),
          RowLocator.fromNumber(grid.value, endRow),
        )
        grid.value.deleteRows(rowRangeLocator)
      },
    })

    this.registerCommand({
      name: 'DeleteCols!',
      description: 'Delete cols',
      execute: (startColStringId: string, endColStringId?: string) => {
        const startColIndex = getColNumber(startColStringId)
        const endColIndex = endColStringId ? getColNumber(endColStringId) : startColIndex
        const startCol = Math.min(startColIndex, endColIndex)
        const grid = this.project.currentGrid
        const endCol = Math.max(startColIndex, endColIndex)
        const colRangeLocator = ColRangeLocator.fromColLocators(
          ColLocator.fromNumber(grid.value, startCol),
          ColLocator.fromNumber(grid.value, endCol),
        )
        grid.value.deleteCols(colRangeLocator)
      },
    })

    this.registerCommand({
      name: 'InsertRowsBefore!',
      description: 'Insert rows before',
      execute: (startRowStringId: string, endRowStringId?: string) => {
        const grid = this.project.currentGrid
        const startRowIndex = getRowNumber(startRowStringId)
        const endRowIndex = endRowStringId ? getRowNumber(endRowStringId) : startRowIndex
        const startRow = Math.min(startRowIndex, endRowIndex)
        const endRow = Math.max(startRowIndex, endRowIndex)
        const rowRangeLocator = RowRangeLocator.fromRowLocators(
          RowLocator.fromNumber(grid.value, startRow),
          RowLocator.fromNumber(grid.value, endRow),
        )
        grid.value.insertRowsBefore(rowRangeLocator)
      },
    })

    this.registerCommand({
      name: 'InsertRowsAfter!',
      description: 'Insert rows before',
      execute: (startRowStringId: string, endRowStringId?: string) => {
        const grid = this.project.currentGrid
        const startRowIndex = getRowNumber(startRowStringId)
        const endRowIndex = endRowStringId ? getRowNumber(endRowStringId) : startRowIndex
        const startRow = Math.min(startRowIndex, endRowIndex)
        const endRow = Math.max(startRowIndex, endRowIndex)
        const rowRangeLocator = RowRangeLocator.fromRowLocators(
          RowLocator.fromNumber(grid.value, startRow),
          RowLocator.fromNumber(grid.value, endRow),
        )
        grid.value.insertRowsAfter(rowRangeLocator)
      },
    })

    this.registerCommand({
      name: 'InsertColsBefore!',
      description: 'Insert columns before',
      execute: (startColStringId: string, endColStringId?: string) => {
        const grid = this.project.currentGrid
        const startColIndex = getColNumber(startColStringId)
        const endColIndex = endColStringId ? getColNumber(endColStringId) : startColIndex
        const startCol = Math.min(startColIndex, endColIndex)
        const endCol = Math.max(startColIndex, endColIndex)
        const colRangeLocator = ColRangeLocator.fromColLocators(
          ColLocator.fromNumber(grid.value, startCol),
          ColLocator.fromNumber(grid.value, endCol),
        )

        grid.value.insertColsBefore(colRangeLocator)
      },
    })

    this.registerCommand({
      name: 'InsertColsAfter!',
      description: 'Insert columns before',
      execute: (startColStringId: string, endColStringId?: string) => {
        const grid = this.project.currentGrid
        const startColIndex = getColNumber(startColStringId)
        const endColIndex = endColStringId ? getColNumber(endColStringId) : startColIndex
        const startCol = Math.min(startColIndex, endColIndex)
        const endCol = Math.max(startColIndex, endColIndex)
        const colRangeLocator = ColRangeLocator.fromColLocators(
          ColLocator.fromNumber(grid.value, startCol),
          ColLocator.fromNumber(grid.value, endCol),
        )

        grid.value.insertColsAfter(colRangeLocator)
      },
    })

    this.registerCommand({
      name: 'Undo!',
      description: 'Undo the last action',
      execute: () => {
        this.project.history.undo()
      },
    })

    this.registerCommand({
      name: 'Redo!',
      description: 'Redo the last action',
      execute: () => {
        this.project.history.redo()
      },
    })

    commandNames.forEach((name) => {
      if (!this.commands.has(name)) {
        throw Error(`Command ${name} not registered`)
      }
    })
  }
}
