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
          if (isCellId(id.symbol)) {
            const cell = this.grid.getOrCreateCell(id.symbol)
            acc[id.symbol] = cell.output.value
          }
          else if (isRange(id.symbol)) {
            const data = getStructuredCellIdsInRange(id.symbol)
            if (data.matrix) {
              const matrixValues: unknown[][] = []
              for (const row of data.matrix) {
                const rowValues: unknown[] = []
                matrixValues.push(rowValues)
                for (const cellId of row) {
                  const cell = this.grid.getOrCreateCell(cellId)
                  rowValues.push(cell.output.value)
                }
              }
              acc[id.symbol] = matrixValues
            }
            else {
              const arrayValues: unknown[] = []
              for (const cellId of data.flat) {
                const cell = this.grid.getOrCreateCell(cellId)
                arrayValues.push(cell.output.value)
              }
              acc[id.symbol] = arrayValues
            }
          }
          else {
            console.error(`Unknown identifier ${id.symbol}`)
          }
          return acc
        }, {})
        const result = lits.run(program, { values, jsFunctions })

        return result
      }
      catch (error) {
        return error
      }
    }

    if (Number.isNaN(parseFloat(input))) {
      return input
    }

    if (Number.isNaN(Number(input))) {
      return input
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
    this._range = `A1-${getColIdFromIndex(cols - 1)}${rows - 1}`
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
      name: 'Clear!',
      execute: (id: string) => {
        this.clear(id)
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

  public clear(id: string) {
    const cellIds: string[] = isCellId(id) ? [id] : isRange(id) ? getCellIdsInRange(id) : []
    cellIds.forEach((cellId) => {
      const cell = this.getCell(cellId)
      if (cell) {
        const [row, col] = fromIdToCoords(cellId)
        this.cells[row][col] = null
        this.trigger()
      }
    })
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

  function moveActiveCell(dir: 'up' | 'down' | 'left' | 'right') {
    const range = isRange(selection.value) ? selection.value : grid.value.range

    switch (dir) {
      case 'up':
        moveActiveCellTo(cellAbove(activeCellId.value, range))
        break
      case 'down':
        moveActiveCellTo(cellBelow(activeCellId.value, range))
        break
      case 'left':
        moveActiveCellTo(cellLeft(activeCellId.value, range))
        break
      case 'right':
        moveActiveCellTo(cellRight(activeCellId.value, range))
        break
    }
  }

  function moveSelection(dir: 'up' | 'down' | 'left' | 'right', steps = 1) {
    const cell = unsortedSelection.value.split('-')[0]
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
    const startCell = unsortedSelection.value.split('-')[0]
    const endCell = unsortedSelection.value.split('-')[1] ?? unsortedSelection.value
    const [row, col] = fromIdToCoords(endCell)
    switch (dir) {
      case 'up':
        setSelection(`${startCell}-${fromCoordsToId(row - steps, col)}`)
        break

      case 'down':
        setSelection(`${startCell}-${fromCoordsToId(row + steps, col)}`)
        break

      case 'left':
        setSelection(`${startCell}-${fromCoordsToId(row, col - steps)}`)
        break

      case 'right':
        setSelection(`${startCell}-${fromCoordsToId(row, col + steps)}`)
        break
    }
  }

  function moveActiveCellToFirstRow() {
    const range = isRange(selection.value) ? selection.value : grid.value.range

    const [rowIndex] = fromRangeToCoords(range)
    const [, colIndex] = fromIdToCoords(activeCellId.value)

    moveActiveCellTo(fromCoordsToId(rowIndex, colIndex))
  }

  function moveActiveCellToFirstCol() {
    const range = isRange(selection.value) ? selection.value : grid.value.range

    const [, colIndex] = fromRangeToCoords(range)
    const [rowIndex] = fromIdToCoords(activeCellId.value)

    moveActiveCellTo(fromCoordsToId(rowIndex, colIndex))
  }

  function moveActiveCellToLastRow() {
    const range = isRange(selection.value) ? selection.value : grid.value.range

    const [, , rowIndex] = fromRangeToCoords(range)
    const [, colIndex] = fromIdToCoords(activeCellId.value)

    moveActiveCellTo(fromCoordsToId(rowIndex, colIndex))
  }

  function moveActiveCellToLastCol() {
    const range = isRange(selection.value) ? selection.value : grid.value.range

    const [, , , colIndex] = fromRangeToCoords(range)
    const [rowIndex] = fromIdToCoords(activeCellId.value)

    moveActiveCellTo(fromCoordsToId(rowIndex, colIndex))
  }

  function moveActiveCellTo(id: string) {
    const withinSelectionRange = isRange(selection.value)
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
    execute: (dir: 'up' | 'down' | 'left' | 'right') => {
      moveActiveCell(dir)
    },
    description: 'Move the active cell in a direction by a number of steps, default steps is 1',
  })
  registerCommand({
    name: 'MoveActiveCellTo!',
    execute: (id: string) => {
      moveActiveCellTo(id)
    },
    description: 'Move the active cell to a specific cell',
  })
  registerCommand({
    name: 'MoveActiveCellToRow!',
    execute: (rowId: string | number) => {
      const [, currentColIndex] = fromIdToCoords(activeCellId.value)
      const rowIndex = (typeof rowId === 'string' ? Number(rowId) : rowId) - 1
      moveActiveCellTo(fromCoordsToId(rowIndex, currentColIndex))
    },
    description: 'Move the active cell to a specific row',
  })
  registerCommand({
    name: 'MoveActiveCellToCol!',
    execute: (colId: string) => {
      const [currentRowIndex] = fromIdToCoords(activeCellId.value)
      const colIndex = getColIndex(colId)
      moveActiveCellTo(fromCoordsToId(currentRowIndex, colIndex))
    },
    description: 'Move the active cell to a specific column',
  })
  registerCommand({
    name: 'MoveActiveCellToFirstRow!',
    execute: () => {
      moveActiveCellToFirstRow()
    },
    description: 'Move the active cell to the first row, within the selection if specified',
  })
  registerCommand({
    name: 'MoveActiveCellToFirstCol!',
    execute: () => {
      moveActiveCellToFirstCol()
    },
    description: 'Move the active cell to the first column, within the selection if specified',
  })
  registerCommand({
    name: 'MoveActiveCellToLastRow!',
    execute: () => {
      moveActiveCellToLastRow()
    },
    description: 'Move the active cell to the last row, within the selection if specified',
  })
  registerCommand({
    name: 'MoveActiveCellToLastCol!',
    execute: () => {
      moveActiveCellToLastCol()
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
