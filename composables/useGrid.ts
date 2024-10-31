import { computed, customRef, ref, shallowReadonly } from 'vue'
import { createSharedComposable } from '@vueuse/core'
import { isLitsFunction, Lits } from '@mojir/lits'
import { CellId } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import { Col } from '~/lib/Col'
import { Row } from '~/lib/Row'

const lits = new Lits()

const defaultNbrOfRows = 50
const defaultNbrOfCols = 26
const activeCellId = ref<CellId>(CellId.fromCoords(0, 0))

const unsortedSelection = ref<CellRange>(CellRange.fromSingleCellId(activeCellId.value))
const selection = computed(() => unsortedSelection.value.toSorted())

const { registerCommand, jsFunctions } = useCommandCenter()

export type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom' | 'leftmost' | 'rightmost'

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
        const values = this.grid.getValuesFromUndefinedIdentifiers(unresolvedIdentifiers)
        const result = lits.run(program, { values, jsFunctions })
        return result
      }
      catch (error) {
        return error
      }
    }

    if (!Number.isNaN(parseFloat(input)) && !Number.isNaN(Number(input))) {
      return Number(input)
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

    if (Array.isArray(formattedValue)) {
      return JSON.stringify(formattedValue)
    }

    if (typeof formattedValue === 'object' && formattedValue !== null) {
      return JSON.stringify(formattedValue)
    }

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

  constructor(private readonly grid: Grid, public cellId: CellId) {}
}

class Grid {
  public readonly rows: Row[]
  public readonly cols: Col[]
  public readonly cells: (Cell | null)[][]
  public readonly rowHeaderWidth = 50
  public readonly colHeaderHeight = 25
  public readonly cellAliases = new Map<string, Cell>()
  private _range: CellRange

  constructor(rows: number, cols: number, private readonly trigger: () => void) {
    this.rows = Array.from({ length: rows }, (_, rowIndex) => Row.create(rowIndex, 26))
    this.cols = Array.from({ length: cols }, (_, colIndex) => Col.create(colIndex, 100))
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    )
    this._range = CellRange.fromCellIds(CellId.fromCoords(0, 0), CellId.fromCoords(rows - 1, cols - 1))
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
        this.clearRange(id)
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

  public getCellId(id: string | CellId): CellId {
    if (CellId.isCellId(id)) {
      return id
    }
    const cell = this.cellAliases.get(id)
    return cell ? cell.cellId : CellId.fromId(id)
  }

  public getOrCreateCell(id: string | CellId): Cell {
    const cellId = this.getCellId(id)
    const rowIndex = cellId.rowIndex
    const colIndex = cellId.colIndex
    if (this.cells[rowIndex][colIndex] !== null) {
      return this.cells[rowIndex][colIndex]
    }
    this.cells[rowIndex][colIndex] = new Cell(this, cellId)
    this.trigger()
    return this.cells[rowIndex][colIndex]
  }

  public getActiveCell(): Cell | undefined {
    return this.getCell(activeCellId.value)
  }

  public getCell(id: string | CellId): Cell | undefined {
    const cellId = this.getCellId(id)
    return this.cells[cellId.rowIndex][cellId.colIndex] ?? undefined
  }

  public getRow(id: string): Row | undefined {
    return this.rows[Row.getRowIndexFromId(id)]
  }

  public getCol(id: string): Col | undefined {
    return this.cols[Col.getColIndexFromId(id)]
  }

  public clearRange(id: string | CellRange) {
    const cellRange = CellRange.isCellRange(id)
      ? id
      : CellRange.isCellRangeString(id)
        ? CellRange.fromId(id)
        : null

    const cellIds: CellId[] = cellRange?.getAllCellIds() ?? []
    cellIds.forEach((cellId) => {
      const cell = this.getCell(cellId)
      if (cell) {
        this.cells[cellId.rowIndex][cellId.colIndex] = null
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

  getValuesFromUndefinedIdentifiers(unresolvedIdentifiers: Set<{ symbol: string }>) {
    return [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, id) => {
      if (CellId.isCellIdString(id.symbol)) {
        const cell = this.getOrCreateCell(id.symbol)
        acc[id.symbol] = cell.output.value
      }
      else if (CellRange.isCellRangeString(id.symbol)) {
        const data = CellRange.fromId(id.symbol).getStructuredCellIds()
        if (data.matrix) {
          const matrixValues: unknown[][] = []
          for (const row of data.matrix) {
            const rowValues: unknown[] = []
            matrixValues.push(rowValues)
            for (const cellId of row) {
              const cell = this.getOrCreateCell(cellId)
              rowValues.push(cell.output.value)
            }
          }
          acc[id.symbol] = matrixValues
        }
        else {
          const arrayValues: unknown[] = []
          for (const cellId of data.array) {
            const cell = this.getOrCreateCell(cellId)
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

  function moveActiveCell(dir: Direction, wrap = false) {
    const range = selection.value.size() > 1 ? selection.value : grid.value.range

    switch (dir) {
      case 'up':
        moveActiveCellTo(activeCellId.value.cellUp(range, wrap))
        break
      case 'down':
        moveActiveCellTo(activeCellId.value.cellDown(range, wrap))
        break
      case 'left':
        moveActiveCellTo(activeCellId.value.cellLeft(range, wrap))
        break
      case 'right':
        moveActiveCellTo(activeCellId.value.cellRight(range, wrap))
        break
      case 'top':
        moveActiveCellTo(activeCellId.value.cellTop(range))
        break
      case 'bottom':
        moveActiveCellTo(activeCellId.value.cellBottom(range))
        break
      case 'leftmost':
        moveActiveCellTo(activeCellId.value.cellLeftmost(range))
        break
      case 'rightmost':
        moveActiveCellTo(activeCellId.value.cellRightmost(range))
        break
    }
  }

  function expandSelection(dir: Direction) {
    const start = unsortedSelection.value.start
    const end = unsortedSelection.value.end.cellMove(dir, grid.value.range, false)

    unsortedSelection.value = CellRange.fromCellIds(start, end)
  }

  function moveActiveCellTo(id: string | CellId) {
    const cellId = grid.value.getCellId(id)

    const range = selection.value.size() > 1
      ? selection.value
      : grid.value.range

    activeCellId.value = cellId.clamp(range)
    unsortedSelection.value = CellRange.fromSingleCellId(activeCellId.value)
  }

  function selectRange(id: string | CellRange) {
    const range = CellRange.isCellRange(id)
      ? id
      : CellRange.isCellRangeString(id)
        ? CellRange.fromId(id).clamp(grid.value.range)
        : null

    if (!range) {
      console.error(`Invalid range: ${id}`)
      return
    }

    unsortedSelection.value = range
  }

  function selectCell(id: string | CellId) {
    const cellId = CellId.isCellId(id)
      ? id
      : CellId.isCellIdString(id)
        ? CellId.fromId(id).clamp(grid.value.range)
        : null

    if (!cellId) {
      console.error(`Invalid cell id: ${id}`)
      return
    }

    unsortedSelection.value = CellRange.fromSingleCellId(cellId)
  }

  function selectAll() {
    unsortedSelection.value = grid.value.range
  }

  function selectColRange(fromCol: Col, toCol: Col) {
    unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(0, fromCol.index),
        CellId.fromCoords(grid.value.range.end.rowIndex, toCol.index))
  }

  function selectRowRange(fromRow: Row, toRow: Row) {
    unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(fromRow.index, 0),
        CellId.fromCoords(toRow.index, grid.value.range.end.colIndex))
  }

  function resetSelection() {
    unsortedSelection.value = CellRange.fromSingleCellId(activeCellId.value)
  }

  function isInsideSelection(id: string | CellId): boolean {
    const cellId = grid.value.getCellId(id)
    return unsortedSelection.value.contains(cellId)
  }

  registerCommand({
    name: 'MoveActiveCell!',
    execute: (dir: Direction) => {
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
    name: 'GetSelection',
    execute: () => unsortedSelection.value,
    description: 'Set the selection',
  })
  registerCommand({
    name: 'SetSelection!',
    execute: (selection: string) => {
      selectRange(selection)
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
    name: 'ExpandSelection!',
    execute: (dir: Direction) => {
      expandSelection(dir)
    },
    description: 'Set the selection',
  })

  return {
    activeCellId: shallowReadonly(activeCellId),
    selection: shallowReadonly(selection),
    grid,
    moveActiveCell,
    moveActiveCellTo,
    selectCell,
    selectRange,
    selectAll,
    resetSelection,
    selectRowRange,
    selectColRange,
    isInsideSelection,
    expandSelection,
  }
})
