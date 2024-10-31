import { CellId } from './CellId'
import { CellRange } from './CellRange'
import { Col } from './Col'
import { Cell } from './Cell'
import { Row } from './Row'

const { registerCommand } = useCommandCenter()

export class Grid {
  public readonly rows: Row[]
  public readonly cols: Col[]
  public readonly cells: (Cell | null)[][]
  public readonly rowHeaderWidth = 50
  public readonly colHeaderHeight = 25
  public readonly cellAliases = new Map<string, Cell>()
  public readonly activeCellId: Ref<CellId>
  public readonly unsortedSelection: Ref<CellRange>
  public readonly selection: ComputedRef<CellRange>
  private _range: CellRange

  constructor(rows: number, cols: number, private readonly trigger: () => void) {
    this.activeCellId = ref<CellId>(CellId.fromCoords(0, 0))
    this.unsortedSelection = ref<CellRange>(CellRange.fromSingleCellId(this.activeCellId.value))
    this.selection = computed(() => this.unsortedSelection.value.toSorted())
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
        return this.activeCellId.value
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

  public createCellAlias(alias: string, id: string | CellId) {
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
    return this.getOrCreateCell(this.activeCellId.value)
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
    return this.getCell(this.activeCellId.value)
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
      if (this.cellAliases.has(id.symbol)) {
        const cell = this.cellAliases.get(id.symbol)!
        acc[id.symbol] = cell.output.value
      }
      else if (CellId.isCellIdString(id.symbol)) {
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
