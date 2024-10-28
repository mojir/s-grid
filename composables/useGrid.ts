import { computed, customRef, ref, shallowReadonly } from 'vue'
import { createSharedComposable } from '@vueuse/core'
import { isLitsFunction, Lits } from '@mojir/lits'
import { clampId, clampSelection, fromCoordsToId, fromIdToCoords, fromRangeToCoords, getColIdFromIndex, getColIndex, insideSelection, isCellId, sortSelection } from '@/utils/cellId'

export type Row = { index: number, label: string, height: number }
export type Col = { index: number, label: string, width: number }
const lits = new Lits()

const defaultNbrOfRows = 100
const defaultNbrOfCols = 26
const activeCellId = ref<string>('A1')
const unsortedSelection = ref<string>('A1')

const selection = computed(() => sortSelection(unsortedSelection.value))

const { registerCommand, jsFunctions } = useCommandCenter()

export class Cell {
  public input = ref('')
  public alias = ref<string | null>(null)
  public output = computed(() => {
    const input = this.input.value

    if (input === '') {
      return 0
    }

    if (input.startsWith('=')) {
      const program = input.slice(1)

      try {
        const { unresolvedIdentifiers } = lits.analyze(program, { jsFunctions })
        const values = [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, id) => {
          const cell = this.grid.getOrCreateCell(id.symbol)
          acc[id.symbol] = cell.output.value
          return acc
        }, {})
        const result = lits.run(program, { values, jsFunctions })

        return result
      }
      catch (error) {
        return error
      }
    }

    const number = parseFloat(input)
    if (!Number.isNaN(number)) {
      return number
    }

    return input
  })

  public displayValue = computed<string>(() => {
    if (this.input.value === '') {
      return ''
    }

    if (this.output.value instanceof Error) {
      return 'ERR'
    }
    if (isLitsFunction(this.output.value)) {
      const alias = this.alias.value
      return `${alias ? `${alias} ` : ''}λ`
    }

    const formattedValue = this.formatterFn.value
      ? lits.apply(this.formatterFn.value, [this.output.value])
      : this.output.value

    return `${formattedValue}`
  })

  public formatter = ref<string | null>(null)

  private formatterFn = computed(() => {
    if (this.formatter.value === null) {
      return null
    }
    const tokenStream = lits.tokenize(this.formatter.value)
    const ast = lits.parse(tokenStream)
    const fn = lits.evaluate(ast, {})
    return isLitsFunction(fn) ? fn : null
  })

  constructor(private readonly grid: Grid, public id: string) {
    console.log('Cell created')
  }
}

class Grid {
  public readonly rows: Row[]
  public readonly cols: Col[]
  public readonly cells: (Cell | null)[][]
  public readonly rowHeaderWidth = 50
  public readonly colHeaderHeight = 25
  public readonly cellAliases = new Map<string, Cell>()
  private _range: string

  constructor(rows: number, cols: number, private readonly trigger: () => void) {
    this.rows = Array.from({ length: rows }, (_, i) => ({
      index: i,
      label: `${i + 1}`,
      height: 26,
    }))
    this.cols = Array.from({ length: cols }, (_, i) => ({
      index: i,
      label: getColIdFromIndex(i),
      width: 100,
    }))
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    )
    this._range = `A1:${getColIdFromIndex(cols - 1)}${rows - 1}`
    this.registerCommands()
  }

  public get range() {
    return this._range
  }

  private registerCommands() {
    registerCommand({
      name: 'SetCellInput!',
      execute: (id: string, input: string) => {
        const cell = this.getOrCreateCell(id)
        cell.input.value = input
      },
      description: 'Set the input of a cell',
    })
    registerCommand({
      name: 'ClearCell!',
      execute: (id: string) => {
        this.clearCell(id)
      },
      description: 'Set the input of a cell',
    })
    registerCommand({
      name: 'ClearAllCells!',
      execute: () => {
        this.clearAllCells()
      },
      description: 'Clear all cells',
    })
    registerCommand({
      name: 'ClearActiveCell!',
      execute: () => {
        this.clearActiveCell()
      },
      description: 'Clear the active cell',
    })
    registerCommand({
      name: 'GetActiveCellId',
      execute: () => {
        return activeCellId.value
      },
      description: 'Set the input of a cell',
    })
    registerCommand({
      name: 'GetCellInput',
      execute: (id: string) => {
        const cell = this.getCell(id)
        return cell?.input.value
      },
      description: 'Get the input of a cell',
    })
    registerCommand({
      name: 'GetCellOutput',
      execute: (id: string) => {
        const cell = this.getCell(id)
        return cell?.output.value
      },
      description: 'Get the output of a cell',
    })
    registerCommand({
      name: 'GetCellDisplayValue',
      execute: (id: string) => {
        const cell = this.getCell(id)
        return cell?.displayValue.value
      },
      description: 'Get the formatted output of a cell',
    })
    registerCommand({
      name: 'GetActiveCellInput',
      execute: () => {
        return this.getActiveCell()?.input.value
      },
      description: 'Get the input of a cell',
    })
    registerCommand({
      name: 'GetActiveCellOutput',
      execute: () => {
        return this.getActiveCell()?.output.value ?? 0
      },
      description: 'Get the output of a cell',
    })
    registerCommand({
      name: 'GetActiveCellDisplayValue',
      execute: () => {
        return this.getActiveCell()?.displayValue.value
      },
      description: 'Get the formatted output of a cell',
    })
    registerCommand({
      name: 'CreateCellAlias!',
      execute: (alias: string, id: string) => {
        this.createCellAlias(alias, id)
      },
      description: 'Create an alias for a cell',
    })
    registerCommand({
      name: 'RenameCellAlias!',
      execute: (alias: string, newAlias: string) => {
        this.renameCellAlias(alias, newAlias)
      },
      description: 'Rename an alias for a cell',
    })
  }

  public createCellAlias(alias: string, id: string) {
    if (this.cellAliases.has(alias)) {
      throw new Error(`Alias ${alias} already exists`)
    }
    const cell = this.getOrCreateCell(id)
    cell.alias.value = alias
    this.cellAliases.set(alias, cell)
  }

  public renameCellAlias(alias: string, newAlias: string) {
    if (!this.cellAliases.has(alias)) {
      throw new Error(`Alias ${alias} does not exist`)
    }
    if (this.cellAliases.has(newAlias)) {
      throw new Error(`newAlias ${alias} already exists`)
    }
    const cell = this.getOrCreateCell(alias)
    cell.alias.value = newAlias
    this.cellAliases.delete(alias)
    this.cellAliases.set(newAlias, cell)
  }

  public getOrCreateActiveCell(): Cell {
    return this.getOrCreateCell(activeCellId.value)
  }

  public getOrCreateCell(id: string): Cell {
    const cell = this.cellAliases.get(id)
    const cellId = cell ? cell.id : id
    const [row, col] = fromIdToCoords(cellId)
    if (this.cells[row][col] !== null) {
      return this.cells[row][col]
    }
    this.cells[row][col] = new Cell(this, cellId)
    this.trigger()
    return this.cells[row][col]
  }

  public getActiveCell(): Cell | undefined {
    return this.getCell(activeCellId.value)
  }

  public getCell(id: string): Cell | undefined {
    const cell = this.cellAliases.get(id)
    const cellId = cell ? cell.id : id
    const [row, col] = fromIdToCoords(cellId)
    return this.cells[row][col] ?? undefined
  }

  public clearActiveCell() {
    this.clearCell(activeCellId.value)
  }

  public clearCell(id: string) {
    const cell = this.getCell(id)
    if (cell) {
      const [row, col] = fromIdToCoords(id)
      this.cells[row][col] = null
      this.trigger()
    }
  }

  public clearAllCells() {
    const rows = this.cells.length
    const cols = this.cells[0].length
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.cells[row][col] = null
      }
    }
    this.trigger()
  }
}

type MoveActiveCellOptions = {
  steps?: number
  withinSelection?: boolean
}

type MoveActiveCellToOptions = {
  withinSelection?: boolean
}

export const useGrid = createSharedComposable(() => {
  const grid = shallowReadonly(customRef((track, trigger) => {
    const gridInstance = new Grid(defaultNbrOfRows, defaultNbrOfCols, trigger)
    return {
      get() {
        track()
        return gridInstance
      },
      set() { },
    }
  }))

  function moveActiveCell(dir: 'up' | 'down' | 'left' | 'right', options: MoveActiveCellOptions = {}) {
    const steps = options.steps ?? 1
    const [row, col] = fromIdToCoords(activeCellId.value)
    switch (dir) {
      case 'up':
        moveActiveCellTo(fromCoordsToId(row - steps, col), options)
        break
      case 'down':
        moveActiveCellTo(fromCoordsToId(row + steps, col), options)
        break
      case 'left':
        moveActiveCellTo(fromCoordsToId(row, col - steps), options)
        break
      case 'right':
        moveActiveCellTo(fromCoordsToId(row, col + steps), options)
        break
    }
  }

  function moveSelection(dir: 'up' | 'down' | 'left' | 'right', steps = 1) {
    const cell = unsortedSelection.value.split(':')[0]
    const [row, col] = fromIdToCoords(cell)
    switch (dir) {
      case 'up':
        setSelection(fromCoordsToId(row - steps, col))
        break

      case 'down':
        setSelection(fromCoordsToId(row + steps, col))
        break

      case 'left':
        setSelection(fromCoordsToId(row, col - steps))
        break

      case 'right':
        setSelection(fromCoordsToId(row, col + steps))
        break
    }
  }

  function expandSelection(dir: 'up' | 'down' | 'left' | 'right', steps = 1) {
    const startCell = unsortedSelection.value.split(':')[0]
    const endCell = unsortedSelection.value.split(':')[1] ?? unsortedSelection.value
    const [row, col] = fromIdToCoords(endCell)
    switch (dir) {
      case 'up':
        setSelection(`${startCell}:${fromCoordsToId(row - steps, col)}`)
        break

      case 'down':
        setSelection(`${startCell}:${fromCoordsToId(row + steps, col)}`)
        break

      case 'left':
        setSelection(`${startCell}:${fromCoordsToId(row, col - steps)}`)
        break

      case 'right':
        setSelection(`${startCell}:${fromCoordsToId(row, col + steps)}`)
        break
    }
  }

  function moveActiveCellToFirstRow(options: MoveActiveCellToOptions = {}) {
    const range = options.withinSelection && !isCellId(selection.value)
      ? selection.value
      : grid.value.range

    const [rowIndex] = fromRangeToCoords(range)
    const [, colIndex] = fromIdToCoords(activeCellId.value)

    moveActiveCellTo(fromCoordsToId(rowIndex, colIndex), options)
  }

  function moveActiveCellToFirstCol(options: MoveActiveCellToOptions = {}) {
    const range = options.withinSelection && !isCellId(selection.value)
      ? selection.value
      : grid.value.range

    const [, colIndex] = fromRangeToCoords(range)
    const [rowIndex] = fromIdToCoords(activeCellId.value)

    moveActiveCellTo(fromCoordsToId(rowIndex, colIndex), options)
  }

  function moveActiveCellToLastRow(options: MoveActiveCellToOptions = {}) {
    const range = options.withinSelection && !isCellId(selection.value)
      ? selection.value
      : grid.value.range

    const [, , rowIndex] = fromRangeToCoords(range)
    const [, colIndex] = fromIdToCoords(activeCellId.value)

    moveActiveCellTo(fromCoordsToId(rowIndex, colIndex), options)
  }

  function moveActiveCellToLastCol(options: MoveActiveCellToOptions = {}) {
    const range = options.withinSelection && !isCellId(selection.value)
      ? selection.value
      : grid.value.range

    const [, , , colIndex] = fromRangeToCoords(range)
    const [rowIndex] = fromIdToCoords(activeCellId.value)

    moveActiveCellTo(fromCoordsToId(rowIndex, colIndex), options)
  }

  function moveActiveCellTo(id: string, options: MoveActiveCellToOptions = {}) {
    const withinSelectionRange = options.withinSelection && !isCellId(selection.value)
    const range = withinSelectionRange
      ? selection.value
      : grid.value.range

    activeCellId.value = clampId(id, range)
    if (!withinSelectionRange) {
      unsortedSelection.value = activeCellId.value
    }
  }

  function setSelection(newSelection: string) {
    unsortedSelection.value = clampSelection(newSelection, grid.value.range)
  }

  function resetSelection() {
    unsortedSelection.value = activeCellId.value
  }

  function isInsideSelection(id: string): boolean {
    return insideSelection(unsortedSelection.value, id)
  }

  registerCommand({
    name: 'MoveActiveCell!',
    execute: (dir: 'up' | 'down' | 'left' | 'right', steps = 1) => {
      moveActiveCell(dir, { steps })
    },
    description: 'Move the active cell in a direction by a number of steps, default steps is 1',
  })
  registerCommand({
    name: 'MoveActiveCellTo!',
    execute: (id: string, options: MoveActiveCellToOptions) => {
      moveActiveCellTo(id, options)
    },
    description: 'Move the active cell to a specific cell',
  })
  registerCommand({
    name: 'MoveActiveCellToRow!',
    execute: (rowId: string | number, options: MoveActiveCellToOptions) => {
      const [, currentColIndex] = fromIdToCoords(activeCellId.value)
      const rowIndex = (typeof rowId === 'string' ? Number(rowId) : rowId) - 1
      moveActiveCellTo(fromCoordsToId(rowIndex, currentColIndex), options)
    },
    description: 'Move the active cell to a specific row',
  })
  registerCommand({
    name: 'MoveActiveCellToCol!',
    execute: (colId: string, options: MoveActiveCellToOptions) => {
      const [currentRowIndex] = fromIdToCoords(activeCellId.value)
      const colIndex = getColIndex(colId)
      moveActiveCellTo(fromCoordsToId(currentRowIndex, colIndex), options)
    },
    description: 'Move the active cell to a specific column',
  })
  registerCommand({
    name: 'MoveActiveCellToFirstRow!',
    execute: (options: MoveActiveCellToOptions) => {
      moveActiveCellToFirstRow(options)
    },
    description: 'Move the active cell to the first row, within the selection if specified',
  })
  registerCommand({
    name: 'MoveActiveCellToFirstCol!',
    execute: (options: MoveActiveCellToOptions) => {
      moveActiveCellToFirstCol(options)
    },
    description: 'Move the active cell to the first column, within the selection if specified',
  })
  registerCommand({
    name: 'MoveActiveCellToLastRow!',
    execute: (options: MoveActiveCellToOptions) => {
      moveActiveCellToLastRow(options)
    },
    description: 'Move the active cell to the last row, within the selection if specified',
  })
  registerCommand({
    name: 'MoveActiveCellToLastCol!',
    execute: (options: MoveActiveCellToOptions) => {
      moveActiveCellToLastCol(options)
    },
    description: 'Move the active cell to the last column, within the selection if specified',
  })
  registerCommand({
    name: 'GetSelection',
    execute: () => unsortedSelection.value,
    description: 'Set the selection',
  })
  registerCommand({
    name: 'SetSelection!',
    execute: (selection: string) => {
      setSelection(selection)
    },
    description: 'Set the selection',
  })
  registerCommand({
    name: 'ResetSelection!',
    execute: () => {
      resetSelection()
    },
    description: 'Set the selection',
  })
  registerCommand({
    name: 'MoveSelection!',
    execute: (dir: 'up' | 'down' | 'left' | 'right', steps = 1) => {
      moveSelection(dir, steps)
    },
    description: 'Set the selection',
  })
  registerCommand({
    name: 'ExpandSelection!',
    execute: (dir: 'up' | 'down' | 'left' | 'right', steps = 1) => {
      expandSelection(dir, steps)
    },
    description: 'Set the selection',
  })

  return {
    activeCellId: shallowReadonly(activeCellId),
    selection: shallowReadonly(selection),
    fromCoordsToId,
    fromIdToCoords,
    grid,
    moveActiveCell,
    moveActiveCellTo,
    setSelection,
    resetSelection,
    isInsideSelection,
    moveSelection,
    expandSelection,
  }
})
