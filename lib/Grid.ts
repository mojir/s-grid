import { Cell } from './Cell'
import { CellId } from './CellId'
import { CellRange } from './CellRange'
import { CellStyle, defaultLineHeight, getLineHeight, type CellStyleName } from './CellStyle'
import { Col } from './Col'
import type { Color } from './color'
import { Row } from './Row'

const minRowHeight = 16

export type CellOrRangeTarget = string | CellId | CellRange
export type CellTarget = string | CellId

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

  public setInput(input: string, target?: CellOrRangeTarget) {
    this.getCells(target).forEach((cell) => {
      cell.input.value = input
    })
  }

  public setAlias(alias: string, target?: CellTarget) {
    if (this.cellAliases.has(alias)) {
      throw new Error(`Alias ${alias} already exists`)
    }
    const cell = target ? this.getCell(target) : this.getCurrentCell()
    cell.alias.value = alias
    this.cellAliases.set(alias, cell)
  }

  private getCellId(target?: CellTarget): CellId {
    if (target === undefined) {
      return this.selection.value.start
    }

    if (CellId.isCellId(target)) {
      return target
    }
    const cell = this.cellAliases.get(target)
    return cell ? cell.cellId : CellId.fromId(target)
  }

  public getCurrentCell(): Cell {
    return this.getCell(this.position.value)
  }

  public getCell(target?: CellTarget): Cell {
    const cellId = this.getCellId(target)
    const cell = this.cells[cellId.rowIndex][cellId.colIndex]
    if (!cell) {
      throw new Error(`Cell ${cellId.id} is out of range`)
    }

    return cell
  }

  public getCells(target?: CellOrRangeTarget): Cell[] {
    if (!target) {
      return this.selection.value.getAllCellIds().map(cellId => this.getCell(cellId))
    }
    else if (CellRange.isCellRange(target)) {
      return target.getAllCellIds().map(cellId => this.getCell(cellId))
    }
    else if (CellRange.isCellRangeString(target)) {
      return CellRange.fromId(target).getAllCellIds().map(cellId => this.getCell(cellId))
    }
    else if (CellId.isCellId(target)) {
      return [this.getCell(target)]
    }
    else if (CellId.isCellIdString(target)) {
      return [this.getCell(target)]
    }

    throw new Error(`Invalid target: ${JSON.stringify(target)}`)
  }

  public getRow(id: string): Row | undefined {
    return this.rows[Row.getRowIndexFromId(id)]
  }

  public getCol(id: string): Col | undefined {
    return this.cols[Col.getColIndexFromId(id)]
  }

  public clear(target?: CellOrRangeTarget) {
    this.getCells(target).forEach((cell) => {
      cell.input.value = ''
      cell.backgroundColor.value = null
      cell.textColor.value = null
      cell.style.value = new CellStyle()
    })
  }

  public clearAllCells() {
    this.clear(this.range)
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

  public movePositionTo(target: CellTarget) {
    const cellId = this.getCellId(target)
    this.position.value = cellId.clamp(this.range)

    if (!this.selection.value.contains(this.position.value)) {
      this.unsortedSelection.value = CellRange.fromSingleCellId(this.position.value)
    }
  }

  public select(target?: CellOrRangeTarget) {
    const range = CellRange.isCellRange(target)
      ? target
      : CellRange.isCellRangeString(target)
        ? CellRange.fromId(target).clamp(this.range)
        : CellId.isCellId(target)
          ? CellRange.fromSingleCellId(target).clamp(this.range)
          : CellId.isCellIdString(target)
            ? CellRange.fromSingleCellId(CellId.fromId(target)).clamp(this.range)
            : null

    if (!range) {
      console.error(`Unable to select, invalid target: ${target}`)
      return
    }

    this.unsortedSelection.value = range
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

  public isInsideSelection(id: CellTarget): boolean {
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

  public setBackgroundColor(color: Color | null, target?: CellOrRangeTarget): void {
    const cells = this.getCells(target)

    cells.forEach((cell) => {
      cell.backgroundColor.value = color
    })
  }

  public getBackgroundColor(target?: CellOrRangeTarget): Color | null {
    const cells = this.getCells(target)
    const color = cells[0]?.backgroundColor.value ?? null

    return cells.slice(1).every(cell => cell.backgroundColor.value === color) ? color : null
  }

  public setTextColor(color: Color | null, target?: CellOrRangeTarget): void {
    const cells = this.getCells(target)

    console.log('cells', cells)
    cells.forEach((cell) => {
      cell.textColor.value = color
    })
  }

  public getTextColor(target?: CellOrRangeTarget): Color | null {
    const cells = this.getCells(target)
    const color = cells[0]?.textColor.value ?? null

    return cells.slice(1).every(cell => cell.textColor.value === color) ? color : null
  }

  public setStyle<T extends CellStyleName>(property: T, value: CellStyle[T], target?: CellOrRangeTarget): void {
    const cells = this.getCells(target)

    cells.forEach((cell) => {
      cell.style.value[property] = value
    })
  }

  public getStyle<T extends CellStyleName>(property: T, target?: CellOrRangeTarget): CellStyle[T] {
    const cells = this.getCells(target)
    const styleValue = cells[0]?.style.value[property]

    return cells.slice(1).every(cell => cell.style.value[property] === styleValue) ? styleValue : undefined
  }

  public setFormatter(formatter: string | null, target?: CellOrRangeTarget): void {
    const cells = this.getCells(target)

    cells.forEach((cell) => {
      cell.formatter.value = formatter
    })
  }

  public getFormatter(target?: CellOrRangeTarget): string | null {
    const cells = this.getCells(target)
    const formatter = cells[0]?.formatter.value ?? null

    return cells.slice(1).every(cell => cell.formatter.value === formatter) ? formatter : null
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
