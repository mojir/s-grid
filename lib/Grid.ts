import { Cell } from './Cell'
import { CellId } from './CellId'
import { CellRange } from './CellRange'
import { defaultLineHeight, getLineHeight, type CellStyle, type CellStyleName } from './CellStyle'
import { Col } from './Col'
import type { Color } from './color'
import { Row } from './Row'

const minRowHeight = 16

export class Grid {
  public readonly rows: Row[]
  public readonly cols: Col[]
  public readonly cells: Cell[][]
  public readonly rowHeaderWidth = 50
  public readonly colHeaderHeight = 25
  public readonly cellAliases = new Map<string, Cell>()
  public readonly position: Ref<CellId>
  public readonly unsortedSelection: Ref<CellRange>
  public readonly selection: ComputedRef<CellRange>
  private _range: CellRange

  constructor(public readonly colorMode: Ref<Ref<string> | null>, rows: number, cols: number, private readonly trigger: () => void) {
    this.position = ref<CellId>(CellId.fromCoords(0, 0))
    this.unsortedSelection = ref<CellRange>(CellRange.fromSingleCellId(this.position.value))
    this.selection = computed(() => this.unsortedSelection.value.toSorted())
    this.rows = Array.from({ length: rows }, (_, rowIndex) => Row.create(rowIndex, defaultLineHeight))
    this.cols = Array.from({ length: cols }, (_, colIndex) => Col.create(colIndex, 100))
    this.cells = Array.from({ length: rows }, (_, rowIndex) =>
      Array.from({ length: cols }, (_, colIndex) => new Cell(this, CellId.fromCoords(rowIndex, colIndex))),
    )
    this._range = CellRange.fromCellIds(CellId.fromCoords(0, 0), CellId.fromCoords(rows - 1, cols - 1))
  }

  public get range() {
    return this._range
  }

  public setAlias(alias: string, id?: string | CellId) {
    if (this.cellAliases.has(alias)) {
      throw new Error(`Alias ${alias} already exists`)
    }
    const cell = id ? this.getCell(id) : this.getCurrentCell()
    cell.alias.value = alias
    this.cellAliases.set(alias, cell)
  }

  private getCellId(id: string | CellId): CellId {
    if (CellId.isCellId(id)) {
      return id
    }
    const cell = this.cellAliases.get(id)
    return cell ? cell.cellId : CellId.fromId(id)
  }

  public getCurrentCell(): Cell {
    return this.getCell(this.position.value)
  }

  public getCell(id: string | CellId): Cell {
    const cellId = this.getCellId(id)
    const cell = this.cells[cellId.rowIndex][cellId.colIndex]
    if (!cell) {
      throw new Error(`Cell ${cellId.id} is out of range`)
    }

    return cell
  }

  public getCells() {
    return this.cells
      .flatMap(row => row.flatMap(cell => cell))
      .filter(cell => cell !== null)
      .reduce((acc, cell) => {
        acc[cell.cellId.id] = cell.getJson()
        return acc
      }, {} as Record<string, Record<string, unknown>>)
  }

  public getRow(id: string): Row | undefined {
    return this.rows[Row.getRowIndexFromId(id)]
  }

  public getCol(id: string): Col | undefined {
    return this.cols[Col.getColIndexFromId(id)]
  }

  public clearCell(id: string | CellId) {
    // TODO, set cell would be nice, but it's not that easy.
    // We need a reference counter to know when to delete the cell.
    const cell = this.getCell(id)
    if (cell) {
      cell.input.value = ''
    }
  }

  public clearRange(id: string | CellRange) {
    const cellRange = CellRange.isCellRange(id)
      ? id
      : CellRange.isCellRangeString(id)
        ? CellRange.fromId(id)
        : null

    const cellIds: CellId[] = cellRange?.getAllCellIds() ?? []
    cellIds.forEach(cell => this.clearCell(cell))
  }

  public clearAllCells() {
    const rows = this.cells.length
    const cols = this.cells[0].length
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.clearCell(CellId.fromCoords(row, col))
      }
    }
    this.trigger()
  }

  public getValuesFromUndefinedIdentifiers(unresolvedIdentifiers: Set<{ symbol: string }>) {
    return [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, id) => {
      if (this.cellAliases.has(id.symbol)) {
        const cell = this.cellAliases.get(id.symbol)!
        acc[id.symbol] = cell.output.value
      }
      else if (CellId.isCellIdString(id.symbol)) {
        const cell = this.getCell(id.symbol)
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
              const cell = this.getCell(cellId)
              rowValues.push(cell.output.value)
            }
          }
          acc[id.symbol] = matrixValues
        }
        else {
          const arrayValues: unknown[] = []
          for (const cellId of data.array) {
            const cell = this.getCell(cellId)
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

  public expandSelection(dir: Direction) {
    const start = this.unsortedSelection.value.start
    const end = this.unsortedSelection.value.end.cellMove(dir, this.range, false)

    this.unsortedSelection.value = CellRange.fromCellIds(start, end)
  }

  public movePositionTo(id: string | CellId) {
    const cellId = this.getCellId(id)

    this.position.value = cellId.clamp(this.range)
    if (!this.selection.value.contains(this.position.value)) {
      this.unsortedSelection.value = CellRange.fromSingleCellId(this.position.value)
    }
  }

  public selectRange(id: string | CellRange) {
    const range = CellRange.isCellRange(id)
      ? id
      : CellRange.isCellRangeString(id)
        ? CellRange.fromId(id).clamp(this.range)
        : null

    if (!range) {
      console.error(`Invalid range: ${id}`)
      return
    }

    this.unsortedSelection.value = range
  }

  public selectCell(id: string | CellId) {
    const cellId = CellId.isCellId(id)
      ? id
      : CellId.isCellIdString(id)
        ? CellId.fromId(id).clamp(this.range)
        : null

    if (!cellId) {
      console.error(`Invalid cell id: ${id}`)
      return
    }

    this.unsortedSelection.value = CellRange.fromSingleCellId(cellId)
  }

  public selectAll() {
    this.unsortedSelection.value = this.range
  }

  public selectColRange(fromCol: Col, toCol: Col) {
    this.unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(0, fromCol.index),
        CellId.fromCoords(this.range.end.rowIndex, toCol.index))
  }

  public selectRowRange(fromRow: Row, toRow: Row) {
    this.unsortedSelection.value
      = CellRange.fromCellIds(
        CellId.fromCoords(fromRow.index, 0),
        CellId.fromCoords(toRow.index, this.range.end.colIndex))
  }

  public resetSelection() {
    this.unsortedSelection.value = CellRange.fromSingleCellId(this.position.value)
  }

  public isInsideSelection(id: string | CellId): boolean {
    const cellId = this.getCellId(id)
    return this.unsortedSelection.value.contains(cellId)
  }

  public movePosition(dir: Direction, wrap = false) {
    const range = wrap && this.selection.value.size() > 1 ? this.selection.value : this.range

    switch (dir) {
      case 'up':
        this.movePositionTo(this.position.value.cellUp(range, wrap))
        break
      case 'down':
        this.movePositionTo(this.position.value.cellDown(range, wrap))
        break
      case 'left':
        this.movePositionTo(this.position.value.cellLeft(range, wrap))
        break
      case 'right':
        this.movePositionTo(this.position.value.cellRight(range, wrap))
        break
      case 'top':
        this.movePositionTo(this.position.value.cellTop(range))
        break
      case 'bottom':
        this.movePositionTo(this.position.value.cellBottom(range))
        break
      case 'leftmost':
        this.movePositionTo(this.position.value.cellLeftmost(range))
        break
      case 'rightmost':
        this.movePositionTo(this.position.value.cellRightmost(range))
        break
    }
  }

  public setBackgroundColor(color: Color | null, id?: string | CellId) {
    const cellIds = id
      ? [CellId.isCellId(id) ? id : CellId.fromId(id)]
      : this.selection.value.getAllCellIds()

    cellIds.forEach((cellId) => {
      const cell = this.getCell(cellId)
      cell.backgroundColor.value = color
    })
  }

  public setTextColor(color: Color | null, id?: string | CellId) {
    const cellIds = id
      ? [CellId.isCellId(id) ? id : CellId.fromId(id)]
      : this.selection.value.getAllCellIds()

    cellIds.forEach((cellId) => {
      const cell = this.getCell(cellId)
      cell.textColor.value = color
    })
  }

  public setStyle<T extends CellStyleName>(property: T, value: CellStyle[T], id?: string | CellId) {
    if (!id) {
      this.selection.value.getAllCellIds().forEach((cellId) => {
        const cell = this.getCell(cellId)
        cell.style.value[property] = value
      })
    }
    else {
      const cell = this.getCell(id)
      cell.style.value[property] = value
    }
  }

  public setFormatter(formatter: string, id?: string | CellId) {
    const cell = id ? this.getCell(id) : this.getCurrentCell()
    cell.formatter.value = formatter
  }

  public autoSetRowHeight(id?: CellId | string) {
    const cellIds = id
      ? [CellId.isCellId(id) ? id : CellId.fromId(id)]
      : this.selection.value.getAllCellIds()

    cellIds.forEach((cellId) => {
    // No need to auto set row height for cell, if cell is empty
      if (!this.getCell(cellId)?.displayValue.value) {
        return
      }

      const rowIndex = cellId.rowIndex
      const cells = this.getRowCells(rowIndex)

      const maxLineHeight = cells.reduce((acc, cell) => {
        if (!cell.displayValue.value) {
          return acc
        }
        const lineHeight = getLineHeight(cell.style.value.fontSize)
        return lineHeight > acc ? lineHeight : acc
      }, 0)

      this.rows[rowIndex].height.value = Math.max(maxLineHeight, minRowHeight)
    })
  }

  public getRowCells(rowIndex: number): Cell[] {
    const startCellId = CellId.fromCoords(rowIndex, 0)
    const endCellId = CellId.fromCoords(rowIndex, this.cols.length - 1)
    const range = CellRange.fromCellIds(startCellId, endCellId)
    return range
      .getAllCellIds()
      .flatMap(cellId => this.getCell(cellId) ?? [])
  }
}
