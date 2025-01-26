import { CellReference, isCellReferenceString } from './reference/CellReference'
import { getReferenceFromString, type Direction } from './reference/utils'
import { getColIndex, getRowIndex } from './utils'
import { isRangeReferenceString, RangeReference } from './reference/RangeReference'
import { Color } from '~/lib/color'
import type { Project } from '~/lib/project/Project'
import { isFontSize, isStyleAlign, isStyleJustify, isStyleTextDecoration } from '~/dto/CellDTO'

const commandNames = [
  'Clear!',
  'ClearAllCells!',
  'ClearRepl!',
  'CreateNamedFunction!',
  'DeleteCols!',
  'DeleteRows!',
  'OpenDiagramEditor!',
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
  'Redo!',
  'ResetSelection!',
  'RestartRepl!',
  'Select!',
  'AddAlias!',
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
  private lits = useLits()
  private logger = useLogger().createLogger('CommandCenter')

  public constructor(private project: Project) {}

  private registerCommand(command: Command<BuiltinCommandName>) {
    this.commands.set(command.name, command)
    this.lits.registerJsFunction(command.name, { fn: (...args: unknown[]) => this.exec(command.name, ...args) })
  }

  public exec(name: BuiltinCommandName, ...args: unknown[]) {
    const command = this.commands.get(name)
    if (!command) {
      this.logger.error(`Command ${name} not found`)
      return
    }
    return command.execute(...args)
  }

  public registerCommands() {
    const repl = this.project.repl

    this.registerCommand({
      name: 'OpenDiagramEditor!',
      execute: (diagramName: string) => {
        this.project.diagrams.openDiagramEditor(diagramName)
      },
      description: 'Clear the current cell',
    })

    this.registerCommand({
      name: 'CreateNamedFunction!',
      execute: (alias: string, input: string, cellReferenceString?: string) => {
        const grid = this.project.currentGrid
        const reference = (cellReferenceString && CellReference.fromString(grid.value, cellReferenceString)) || grid.value.position.value
        this.project.aliases.setAlias(alias, reference)
        grid.value.setInput(input, reference)
      },
      description: 'Clear the current cell',
    })

    this.registerCommand({
      name: 'SetRowHeight!',
      execute: (height: number, rowIndex?: number, count = 1) => {
        const grid = this.project.currentGrid
        if (rowIndex === undefined) {
          grid.value.setRowHeight(height, null)
          return
        }
        if (count < 1) {
          throw new Error('Count must be greater than 0')
        }

        const rangeReference = RangeReference.fromRowIndex(grid.value, rowIndex, count)
        grid.value.setRowHeight(height, rangeReference)
      },
      description: 'Set row height',
    })

    this.registerCommand({
      name: 'SetColWidth!',
      execute: (width: number, colIndex?: number, count = 1) => {
        const grid = this.project.currentGrid
        if (colIndex === undefined) {
          grid.value.setColWidth(width, null)
          return
        }
        if (count < 1) {
          throw new Error('Count must be greater than 0')
        }

        const rangeReference = RangeReference.fromColIndex(grid.value, colIndex, count)
        grid.value.setRowHeight(width, rangeReference)
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
      execute: (cellReferenceString: string) => {
        const grid = this.project.currentGrid
        const reference = CellReference.fromString(grid.value, cellReferenceString)
        grid.value.movePositionTo(reference)
      },
      description: 'Move the position to a specific cell',
    })
    this.registerCommand({
      name: 'SetInput!',
      execute: (input: string, referenceString?: string) => {
        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setInput(input, null)
          return
        }
        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setInput(input, reference)
      },
      description: 'Set the input of a cell or a range of cells. If no target is specified, set input of all cells in the current selection.',
    })
    this.registerCommand({
      name: 'Clear!',
      execute: (referenceString?: string) => {
        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.clear(null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.clear(reference)
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
      execute: (cellreferenceString: string) => {
        const grid = this.project.currentGrid
        const reference = this.project.aliases.getReference(cellreferenceString)?.value ?? CellReference.fromString(grid.value, cellreferenceString)
        if (reference instanceof CellReference) {
          return reference.getCell().getDebugInfo()
        }
        throw new Error(`Invalid reference: ${cellreferenceString}`)
      },
      description: 'Get a cell. If no target is specified, get the active cell.',
    })
    this.registerCommand({
      name: 'GetCells',
      execute: (referenceString: string) => {
        const grid = this.project.currentGrid
        if (isCellReferenceString(referenceString)) {
          const reference = CellReference.fromString(grid.value, referenceString)
          return [reference.getCell().getDebugInfo()]
        }
        else if (isRangeReferenceString(referenceString)) {
          const rangeReference = RangeReference.fromString(grid.value, referenceString)
          return rangeReference.getCells().map(cell => cell.getDebugInfo())
        }
        else {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
      },
      description: 'Get array of cells. If no target is specified, get all cells in the current selection.',
    })
    this.registerCommand({
      name: 'AddAlias!',
      execute: (alias: string, referenceString?: string) => {
        const grid = this.project.currentGrid.value
        const reference = referenceString ? getReferenceFromString(grid, referenceString) : grid.position.value
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        this.project.aliases.setAlias(alias, reference)
      },
      description: 'Create an alias for a cell',
    })

    this.registerCommand({
      name: 'SetFontSize!',
      execute: (fontSize: number, referenceString?: string) => {
        if (!isFontSize(fontSize)) {
          throw new Error(`Invalid font size: ${fontSize}`)
        }
        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setFontSize(fontSize, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setFontSize(fontSize, reference)
      },
      description: 'Set the font size of a cell or a range of cells. If no target is specified, set the font size of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetBold!',
      execute: (value: boolean, referenceString?: string) => {
        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setBold(value, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setBold(value, reference)
      },
      description: 'Set the bold of a cell or a range of cells. If no target is specified, set the bold of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetItalic!',
      execute: (value: boolean, referenceString?: string) => {
        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setItalic(value, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setItalic(value, reference)
      },
      description: 'Set the italic of a cell or a range of cells. If no target is specified, set the italic of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetTextDecoration!',
      execute: (value: string, referenceString?: string) => {
        if (!isStyleTextDecoration(value)) {
          throw new Error(`Invalid text decoration: ${value}`)
        }

        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setTextDecoration(value, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setTextDecoration(value, reference)
      },
      description: 'Set the text decoration of a cell or a range of cells. If no target is specified, set the text decoration of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetJustify!',
      execute: (value: string, referenceString?: string) => {
        if (!isStyleJustify(value)) {
          throw new Error(`Invalid justify: ${value}`)
        }

        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setJustify(value, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setJustify(value, reference)
      },
      description: 'Set the justify of a cell or a range of cells. If no target is specified, set the justify of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetAlign!',
      execute: (value: string, referenceString?: string) => {
        if (!isStyleAlign(value)) {
          throw new Error(`Invalid align: ${value}`)
        }

        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setAlign(value, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setAlign(value, reference)
      },
      description: 'Set the align of a cell or a range of cells. If no target is specified, set the align of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetBackgroundColor!',
      execute: (hexCode: string, referenceString?: string) => {
        const grid = this.project.currentGrid
        const color = Color.fromHex(hexCode)
        if (!referenceString) {
          grid.value.setBackgroundColor(color, null)
          return
        }
        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setBackgroundColor(color, reference)
      },
      description: 'Set the background color of a cell or a range of cells. If no target is specified, set the background color of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetTextColor!',
      execute: (hexCode: string, referenceString?: string) => {
        const grid = this.project.currentGrid
        const color = Color.fromHex(hexCode)
        if (!referenceString) {
          grid.value.setTextColor(color, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }

        grid.value.setTextColor(color, reference)
      },
      description: 'Set the text color of a cell or a range of cells. If no target is specified, set the text color of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetFormatter!',
      execute: (formatter: string, referenceString?: string) => {
        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setFormatter(formatter, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setFormatter(formatter, reference)
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
      execute: (target: CellReference | string) => {
        const grid = this.project.currentGrid
        grid.value.selection.expandSelectionTo(target)
      },
      description: 'Expand the selection to a cell',
    })

    this.registerCommand({
      name: 'Select!',
      execute: (target: string) => {
        const grid = this.project.currentGrid
        const reference = getReferenceFromString(grid.value, target)
        if (!reference) {
          throw new Error(`Invalid reference: ${target}`)
        }
        if (reference instanceof CellReference) {
          grid.value.selection.updateSelection(reference)
        }
        else {
          grid.value.selection.updateSelection(reference.start, reference.end)
        }
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
      execute: (rowId1: string, rowId2?: string) => {
        const grid = this.project.currentGrid
        const rowIndex1 = getRowIndex(rowId1)
        const rowIndex2 = rowId2 ? getRowIndex(rowId2) : rowIndex1
        const startRowIndex = Math.min(rowIndex1, rowIndex2)
        const endRowIndex = Math.max(rowIndex1, rowIndex2)
        grid.value.deleteRows(startRowIndex, endRowIndex - startRowIndex + 1)
      },
    })

    this.registerCommand({
      name: 'DeleteCols!',
      description: 'Delete cols',
      execute: (colId1: string, colId2?: string) => {
        const grid = this.project.currentGrid
        const colIndex1 = getColIndex(colId1)
        const colIndex2 = colId2 ? getColIndex(colId2) : colIndex1
        const startColIndex = Math.min(colIndex1, colIndex2)
        const endColIndex = Math.max(colIndex1, colIndex2)
        grid.value.deleteCols(startColIndex, endColIndex - startColIndex + 1)
      },
    })

    this.registerCommand({
      name: 'InsertRowsBefore!',
      description: 'Insert rows before',
      execute: (rowId1: string, rowId2?: string) => {
        const grid = this.project.currentGrid
        const rowIndex1 = getRowIndex(rowId1)
        const rowIndex2 = rowId2 ? getRowIndex(rowId2) : rowIndex1
        const startRowIndex = Math.min(rowIndex1, rowIndex2)
        const endRowIndex = Math.max(rowIndex1, rowIndex2)
        grid.value.insertRowsBefore(startRowIndex, endRowIndex - startRowIndex + 1)
      },
    })

    this.registerCommand({
      name: 'InsertRowsAfter!',
      description: 'Insert rows before',
      execute: (rowId1: string, rowId2?: string) => {
        const grid = this.project.currentGrid
        const rowIndex1 = getRowIndex(rowId1)
        const rowIndex2 = rowId2 ? getRowIndex(rowId2) : rowIndex1
        const startRowIndex = Math.min(rowIndex1, rowIndex2)
        const endRowIndex = Math.max(rowIndex1, rowIndex2)
        grid.value.insertRowsAfter(startRowIndex, endRowIndex - startRowIndex + 1)
      },
    })

    this.registerCommand({
      name: 'InsertColsBefore!',
      description: 'Insert columns before',
      execute: (colId1: string, colId2?: string) => {
        const grid = this.project.currentGrid
        const colIndex1 = getColIndex(colId1)
        const colIndex2 = colId2 ? getColIndex(colId2) : colIndex1
        const startColIndex = Math.min(colIndex1, colIndex2)
        const endColIndex = Math.max(colIndex1, colIndex2)
        grid.value.insertColsBefore(startColIndex, endColIndex - startColIndex + 1)
      },
    })

    this.registerCommand({
      name: 'InsertColsAfter!',
      description: 'Insert columns before',
      execute: (colStringId1: string, colStringId2?: string) => {
        const grid = this.project.currentGrid
        const colIndex1 = getColIndex(colStringId1)
        const colIndex2 = colStringId2 ? getColIndex(colStringId2) : colIndex1
        const startColIndex = Math.min(colIndex1, colIndex2)
        const endColIndex = Math.max(colIndex1, colIndex2)
        grid.value.insertColsAfter(startColIndex, endColIndex - startColIndex + 1)
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
