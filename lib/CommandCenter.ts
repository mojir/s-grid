import { CellReference, isCellReferenceString } from './reference/CellReference'
import { directions, getReferenceFromString, isDirection, type Direction } from './reference/utils'
import { isRangeReferenceString, RangeReference } from './reference/RangeReference'
import { Color } from '~/lib/color'
import type { Project } from '~/lib/project/Project'
import { isFontSize, isFormat, isStyleAlign, isStyleJustify, isStyleTextDecoration } from '~/dto/CellDTO'

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
  'RenameProject!',
  'RenameGrid!',
  'RemoveGrid!',
  'AddGrid!',
  'ResetSelection!',
  'RestartRepl!',
  'Select!',
  'AddAlias!',
  'SetBackgroundColor!',
  'SetColWidth!',
  'SetNumberFormatter!',
  'SetInput!',
  'SetRowHeight!',
  'SetFontSize!',
  'SetCellType!',
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
  execute: (...args: unknown[]) => unknown
  paramCount: number | { min?: number, max?: number }
}

function assertMaybeString(value: unknown): asserts value is string | undefined {
  if (value !== undefined && typeof value !== 'string') {
    throw Error(`Expected string got: ${JSON.stringify(value)}`)
  }
}

function assertMaybeNumber(value: unknown): asserts value is number | undefined {
  if (value !== undefined && typeof value !== 'number') {
    throw Error(`Expected number got: ${JSON.stringify(value)}`)
  }
}

function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw Error(`Expected string got: ${JSON.stringify(value)}`)
  }
}

function assertDirection(value: unknown): asserts value is Direction {
  if (!isDirection(value)) {
    throw Error(`Expected direction (${directions.join(', ')}) got: ${JSON.stringify(value)}`)
  }
}

function assertNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw Error(`Expected number got: ${JSON.stringify(value)}`)
  }
}

function assertBoolean(value: unknown): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw Error(`Expected boolean got: ${JSON.stringify(value)}`)
  }
}

export class CommandCenter {
  public commands = new Map<string, Command<string>>()
  private lits = useLits()
  private logger = useLogger().createLogger('CommandCenter')

  public constructor(private project: Project) { }

  private registerCommand(command: Command<BuiltinCommandName>) {
    this.commands.set(command.name, command)
    this.lits.registerJsFunction(command.name, {
      fn: (...args: unknown[]) => this.exec(command.name, ...args),
      paramCount: command.paramCount,
    })
  }

  public exec(name: BuiltinCommandName, ...args: unknown[]) {
    const command = this.commands.get(name)
    if (!command) {
      this.logger.error(`Command "${name}" not found`)
      return
    }
    return command.execute(...args)
  }

  public registerCommands() {
    const repl = this.project.repl

    this.registerCommand({
      name: 'OpenDiagramEditor!',
      execute: (diagramName) => {
        assertString(diagramName)

        this.project.diagrams.openDiagramEditor(diagramName)
      },
      paramCount: 1,
      description: 'Clear the current cell',
    })

    this.registerCommand({
      name: 'CreateNamedFunction!',
      execute: (alias, input, cellReference) => {
        assertString(alias)
        assertString(input)
        assertMaybeString(cellReference)

        const grid = this.project.currentGrid
        const reference = (cellReference && CellReference.fromString(grid.value, cellReference)) || grid.value.position.value
        this.project.aliases.addAlias(alias, reference)
        grid.value.setInput(input, reference)
      },
      paramCount: { min: 2, max: 3 },
      description: 'Clear the current cell',
    })

    this.registerCommand({
      name: 'SetRowHeight!',
      execute: (height, rowIndex, count = 1) => {
        assertNumber(height)
        assertMaybeNumber(rowIndex)
        assertNumber(count)

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
      paramCount: { min: 1, max: 3 },
      description: 'Set row height',
    })

    this.registerCommand({
      name: 'SetColWidth!',
      execute: (width, colIndex, count = 1) => {
        assertNumber(width)
        assertMaybeNumber(colIndex)
        assertNumber(count)

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
      paramCount: { min: 1, max: 3 },
      description: 'Set column width',
    })

    this.registerCommand({
      name: 'MovePosition!',
      execute: (direction) => {
        assertDirection(direction)

        this.project.currentGrid.value.movePosition(direction)
      },
      paramCount: 1,
      description: 'Move the position one step in a specific direction.',
    })
    this.registerCommand({
      name: 'MovePositionTo!',
      execute: (cellReference) => {
        assertString(cellReference)

        const grid = this.project.currentGrid
        const reference = CellReference.fromString(grid.value, cellReference)
        grid.value.movePositionTo(reference)
      },
      paramCount: 1,
      description: 'Move the position to a specific cell',
    })
    this.registerCommand({
      name: 'SetInput!',
      execute: (input, referenceString) => {
        assertString(input)
        assertMaybeString(referenceString)

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
      paramCount: { min: 1, max: 2 },
      description: 'Set the input of a cell or a range of cells. If no target is specified, set input of all cells in the current selection.',
    })
    this.registerCommand({
      name: 'Clear!',
      execute: (referenceString) => {
        assertMaybeString(referenceString)

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
      paramCount: { max: 1 },
      description: 'Clear a cell or a range of cells. If no target is specified, clear the current selection.',
    })
    this.registerCommand({
      name: 'ClearAllCells!',
      execute: () => {
        const grid = this.project.currentGrid
        grid.value.clearAllCells()
      },
      paramCount: 0,
      description: 'Clear all cells',
    })
    this.registerCommand({
      name: 'GetCell',
      execute: (cellreference) => {
        assertString(cellreference)

        const grid = this.project.currentGrid
        const reference = this.project.aliases.getReference(cellreference)?.value ?? CellReference.fromString(grid.value, cellreference)
        if (reference instanceof CellReference) {
          return reference.getCell().getDebugInfo()
        }
        throw new Error(`Invalid reference: ${cellreference}`)
      },
      paramCount: 1,
      description: 'Get a cell. If no target is specified, get the active cell.',
    })
    this.registerCommand({
      name: 'GetCells',
      execute: (referenceString) => {
        assertString(referenceString)

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
      paramCount: 1,
      description: 'Get array of cells. If no target is specified, get all cells in the current selection.',
    })
    this.registerCommand({
      name: 'AddAlias!',
      execute: (alias, referenceString) => {
        assertString(alias)
        assertMaybeString(referenceString)

        const grid = this.project.currentGrid.value
        const reference = referenceString ? getReferenceFromString(grid, referenceString) : grid.position.value
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        this.project.aliases.addAlias(alias, reference)
      },
      paramCount: { min: 1, max: 2 },
      description: 'Create an alias for a cell',
    })

    this.registerCommand({
      name: 'SetFontSize!',
      execute: (fontSize, referenceString) => {
        assertNumber(fontSize)
        assertMaybeString(referenceString)

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
      paramCount: { min: 1, max: 2 },
      description: 'Set the font size of a cell or a range of cells. If no target is specified, set the font size of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetBold!',
      execute: (value, referenceString) => {
        assertBoolean(value)
        assertMaybeString(referenceString)

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
      paramCount: { min: 1, max: 2 },
      description: 'Set the bold of a cell or a range of cells. If no target is specified, set the bold of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetItalic!',
      execute: (value, referenceString) => {
        assertBoolean(value)
        assertMaybeString(referenceString)

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
      paramCount: { min: 1, max: 2 },
      description: 'Set the italic of a cell or a range of cells. If no target is specified, set the italic of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetTextDecoration!',
      execute: (value, referenceString) => {
        assertString(value)
        assertMaybeString(referenceString)

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
      paramCount: { min: 1, max: 2 },
      description: 'Set the text decoration of a cell or a range of cells. If no target is specified, set the text decoration of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetJustify!',
      execute: (value, referenceString) => {
        assertString(value)
        assertMaybeString(referenceString)

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
      paramCount: { min: 1, max: 2 },
      description: 'Set the justify of a cell or a range of cells. If no target is specified, set the justify of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetAlign!',
      execute: (value, referenceString) => {
        assertString(value)
        assertMaybeString(referenceString)

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
      paramCount: { min: 1, max: 2 },
      description: 'Set the align of a cell or a range of cells. If no target is specified, set the align of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetBackgroundColor!',
      execute: (hexCode, referenceString) => {
        assertString(hexCode)
        assertMaybeString(referenceString)

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
      paramCount: { min: 1, max: 2 },
      description: 'Set the background color of a cell or a range of cells. If no target is specified, set the background color of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetTextColor!',
      execute: (value, referenceString) => {
        assertString(value)
        assertMaybeString(referenceString)

        const grid = this.project.currentGrid
        const color = Color.fromHex(value)
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
      paramCount: { min: 1, max: 2 },
      description: 'Set the text color of a cell or a range of cells. If no target is specified, set the text color of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetCellType!',
      execute: (value, referenceString) => {
        assertString(value)
        assertMaybeString(referenceString)

        if (!isFormat(value)) {
          throw new Error(`Invalid cellType: ${value}`)
        }
        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setCellType(value, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setCellType(value, reference)
      },
      paramCount: { min: 1, max: 2 },
      description: 'Set the cell type of a cell or a range of cells. If no target is specified, set the cell type of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'SetNumberFormatter!',
      execute: (value, referenceString) => {
        assertString(value)
        assertMaybeString(referenceString)

        const grid = this.project.currentGrid
        if (!referenceString) {
          grid.value.setNumberFormatter(value, null)
          return
        }

        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        grid.value.setNumberFormatter(value, reference)
      },
      paramCount: { min: 1, max: 2 },
      description: 'Set the number formatter program of a cell or a range of cells. If no target is specified, set the number formatter program of all cells in the current selection.',
    })

    this.registerCommand({
      name: 'ResetSelection!',
      execute: () => {
        const grid = this.project.currentGrid
        grid.value.resetSelection()
      },
      paramCount: 0,
      description: 'Reset the selection',
    })

    this.registerCommand({
      name: 'GetSelection',
      execute: () => this.project.currentGrid.value.selection.selectedRange.value.toStringWithGrid(),
      paramCount: 0,
      description: 'Get the current selection.',
    })

    this.registerCommand({
      name: 'ExpandSelection!',
      execute: (direction) => {
        assertDirection(direction)
        const grid = this.project.currentGrid
        grid.value.selection.expandSelection(direction)
      },
      paramCount: 1,
      description: 'Expand the selection one step in a specific direction',
    })

    this.registerCommand({
      name: 'ExpandSelectionTo!',
      execute: (cellReference) => {
        assertString(cellReference)

        const grid = this.project.currentGrid
        grid.value.selection.expandSelectionTo(cellReference)
      },
      paramCount: 1,
      description: 'Expand the selection to a cell',
    })

    this.registerCommand({
      name: 'Select!',
      execute: (referenceString) => {
        assertString(referenceString)

        const grid = this.project.currentGrid
        const reference = getReferenceFromString(grid.value, referenceString)
        if (!reference) {
          throw new Error(`Invalid reference: ${referenceString}`)
        }
        if (reference instanceof CellReference) {
          grid.value.selection.updateSelection(reference)
        }
        else {
          grid.value.selection.updateSelection(reference.start, reference.end)
        }
      },
      paramCount: 1,
      description: 'Select a cell or a range',
    })

    this.registerCommand({
      name: 'ClearRepl!',
      description: 'Clear the Repl history',
      execute: () => {
        repl.clearRepl()
      },
      paramCount: 0,
    })

    this.registerCommand({
      name: 'RestartRepl!',
      description: 'Clear the Repl Lits context',
      execute: () => {
        repl.restartRepl()
        return 'Repl context cleared'
      },
      paramCount: 0,
    })

    this.registerCommand({
      name: 'Help',
      description: 'Get the list of available commands',
      execute: (topic): string => {
        assertMaybeString(topic)

        return repl.getHelp(topic)
      },
      paramCount: 0,
    })

    this.registerCommand({
      name: 'DeleteRows!',
      description: 'Delete rows',
      execute: (rowId1, rowId2) => {
        assertString(rowId1)
        assertMaybeString(rowId2)

        const grid = this.project.currentGrid
        const rowIndex1 = getRowIndex(rowId1)
        const rowIndex2 = rowId2 ? getRowIndex(rowId2) : rowIndex1
        const startRowIndex = Math.min(rowIndex1, rowIndex2)
        const endRowIndex = Math.max(rowIndex1, rowIndex2)
        grid.value.deleteRows(startRowIndex, endRowIndex - startRowIndex + 1)
      },
      paramCount: { min: 1, max: 2 },
    })

    this.registerCommand({
      name: 'DeleteCols!',
      description: 'Delete cols',
      execute: (colId1, colId2) => {
        assertString(colId1)
        assertMaybeString(colId2)

        const grid = this.project.currentGrid
        const colIndex1 = getColIndex(colId1)
        const colIndex2 = colId2 ? getColIndex(colId2) : colIndex1
        const startColIndex = Math.min(colIndex1, colIndex2)
        const endColIndex = Math.max(colIndex1, colIndex2)
        grid.value.deleteCols(startColIndex, endColIndex - startColIndex + 1)
      },
      paramCount: { min: 1, max: 2 },
    })

    this.registerCommand({
      name: 'InsertRowsBefore!',
      description: 'Insert rows before',
      execute: (rowId1, rowId2) => {
        assertString(rowId1)
        assertMaybeString(rowId2)

        const grid = this.project.currentGrid
        const rowIndex1 = getRowIndex(rowId1)
        const rowIndex2 = rowId2 ? getRowIndex(rowId2) : rowIndex1
        const startRowIndex = Math.min(rowIndex1, rowIndex2)
        const endRowIndex = Math.max(rowIndex1, rowIndex2)
        grid.value.insertRowsBefore(startRowIndex, endRowIndex - startRowIndex + 1)
      },
      paramCount: { min: 1, max: 2 },
    })

    this.registerCommand({
      name: 'InsertRowsAfter!',
      description: 'Insert rows before',
      execute: (rowId1, rowId2) => {
        assertString(rowId1)
        assertMaybeString(rowId2)

        const grid = this.project.currentGrid
        const rowIndex1 = getRowIndex(rowId1)
        const rowIndex2 = rowId2 ? getRowIndex(rowId2) : rowIndex1
        const startRowIndex = Math.min(rowIndex1, rowIndex2)
        const endRowIndex = Math.max(rowIndex1, rowIndex2)
        grid.value.insertRowsAfter(startRowIndex, endRowIndex - startRowIndex + 1)
      },
      paramCount: { min: 1, max: 2 },
    })

    this.registerCommand({
      name: 'InsertColsBefore!',
      description: 'Insert columns before',
      execute: (colId1, colId2) => {
        assertString(colId1)
        assertMaybeString(colId2)

        const grid = this.project.currentGrid
        const colIndex1 = getColIndex(colId1)
        const colIndex2 = colId2 ? getColIndex(colId2) : colIndex1
        const startColIndex = Math.min(colIndex1, colIndex2)
        const endColIndex = Math.max(colIndex1, colIndex2)
        grid.value.insertColsBefore(startColIndex, endColIndex - startColIndex + 1)
      },
      paramCount: { min: 1, max: 2 },
    })

    this.registerCommand({
      name: 'InsertColsAfter!',
      description: 'Insert columns before',
      execute: (colId1, colId2) => {
        assertString(colId1)
        assertMaybeString(colId2)

        const grid = this.project.currentGrid
        const colIndex1 = getColIndex(colId1)
        const colIndex2 = colId2 ? getColIndex(colId2) : colIndex1
        const startColIndex = Math.min(colIndex1, colIndex2)
        const endColIndex = Math.max(colIndex1, colIndex2)
        grid.value.insertColsAfter(startColIndex, endColIndex - startColIndex + 1)
      },
      paramCount: { min: 1, max: 2 },
    })

    this.registerCommand({
      name: 'Undo!',
      description: 'Undo the last action',
      execute: () => {
        this.project.history.undo()
      },
      paramCount: 0,
    })

    this.registerCommand({
      name: 'Redo!',
      description: 'Redo the last action',
      execute: () => {
        this.project.history.redo()
      },
      paramCount: 0,
    })

    this.registerCommand({
      name: 'AddGrid!',
      description: 'Create a new grid',
      execute: (gridName) => {
        assertString(gridName)

        this.project.addGrid(gridName)
      },
      paramCount: 1,
    })

    this.registerCommand({
      name: 'RemoveGrid!',
      description: 'Remove a new grid',
      execute: (gridName) => {
        assertString(gridName)

        const grid = gridName !== undefined ? this.project.getGridByName(gridName) : this.project.currentGrid.value
        this.project.removeGrid(grid)
      },
      paramCount: { max: 1 },
    })

    this.registerCommand({
      name: 'RenameGrid!',
      description: 'Rename a grid',
      execute: (newGridName, oldGridName) => {
        assertString(newGridName)
        assertMaybeString(oldGridName)

        const grid = oldGridName !== undefined ? this.project.getGridByName(oldGridName) : this.project.currentGrid.value
        this.project.renameGrid(grid, newGridName)
      },
      paramCount: { min: 1, max: 2 },
    })

    this.registerCommand({
      name: 'RenameProject!',
      description: 'Renames the opened project',
      execute: (projectName) => {
        assertString(projectName)

        this.project.name.value = projectName
      },
      paramCount: 1,
    })

    commandNames.forEach((name) => {
      if (!this.commands.has(name)) {
        console.error(`Command ${name} not registered`)
      }
    })
  }
}
