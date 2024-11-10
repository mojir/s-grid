import { Cell } from './Cell'
import { CellId } from './CellId'
import { CellRange } from './CellRange'
import { CellStyle, getLineHeight, type CellStyleName } from './CellStyle'
import { Col, type ColIdString } from './Col'
import type { Color } from './color'
import { Row, type RowIdString } from './Row'
import type { CellOrRangeTarget, CellTarget } from './utils'
import { matrixMap } from './matrix'
import type { SelectionComposable } from '~/composables/useSelection'
import type { RowsAndColsComposable } from '~/composables/useRowsAndCols'
import type { AliasComposable } from '~/composables/useAlias'
import type { LitsComposable } from '~/composables/useLits'

export class Grid {
  private readonly rowsAndColsComposable: RowsAndColsComposable
  private readonly selectionComposable: SelectionComposable
  private readonly aliasComposable: AliasComposable

  public readonly cells: Cell[][]
  public readonly position: Ref<CellId>
  private readonly gridRange: ComputedRef<CellRange>

  constructor(
    {
      rowsAndColsComposable,
      selectionComposable,
      aliasComposable,
      litsComposable,
    }: {
      rowsAndColsComposable: RowsAndColsComposable
      selectionComposable: SelectionComposable
      aliasComposable: AliasComposable
      litsComposable: LitsComposable
    },
  ) {
    this.rowsAndColsComposable = rowsAndColsComposable
    this.selectionComposable = selectionComposable
    this.aliasComposable = aliasComposable
    this.position = ref(CellId.fromCoords(0, 0))
    this.cells = Array.from({ length: rowsAndColsComposable.rows.value.length }, (_, rowIndex) =>
      Array.from({ length: rowsAndColsComposable.cols.value.length }, (_, colIndex) => new Cell(CellId.fromCoords(rowIndex, colIndex), { grid: this, litsComposable })),
    )
    this.gridRange = computed(() => CellRange.fromDimensions(0, 0, rowsAndColsComposable.rows.value.length - 1, rowsAndColsComposable.cols.value.length - 1))
  }

  public setInput(input: string, target?: CellOrRangeTarget) {
    this.getCells(target).forEach((cell) => {
      cell.input.value = input
    })
  }

  private getCellId(target?: CellTarget): CellId {
    if (target === undefined) {
      return this.selectionComposable.selection.value.start
    }

    if (CellId.isCellId(target)) {
      return target
    }
    const cell = this.aliasComposable.getAlias(target)
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
      return this.selectionComposable.selection.value.getAllCellIds().map(cellId => this.getCell(cellId))
    }
    else if (CellRange.isCellRange(target)) {
      return target.getAllCellIds().map(cellId => this.getCell(cellId))
    }
    else if (typeof target === 'string' && CellRange.isCellRangeString(target)) {
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

  public clear(target?: CellOrRangeTarget) {
    this.getCells(target).forEach((cell) => {
      cell.input.value = ''
      cell.backgroundColor.value = null
      cell.textColor.value = null
      cell.style.value = new CellStyle()
    })
  }

  public clearAllCells() {
    this.clear(this.gridRange.value)
  }

  public getValuesFromUndefinedIdentifiers(unresolvedIdentifiers: string[]) {
    return [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, target) => {
      const aliasCell = this.aliasComposable.getAlias(target)
      if (aliasCell) {
        acc[target] = aliasCell.output.value
      }
      else if (CellId.isCellIdString(target)) {
        acc[target] = this.getCell(target).output.value
      }
      else if (CellRange.isCellRangeString(target)) {
        acc[target] = matrixMap(
          CellRange.fromId(target).getCellIdMatrix(),
          cellId => this.getCell(cellId).output.value,
        )
      }
      else {
        console.error(`Unknown identifier ${target}`)
      }
      return acc
    }, {})
  }

  public movePositionTo(target: CellTarget) {
    const cellId = this.getCellId(target)
    const newPosition = cellId.clamp(this.gridRange.value)
    if (newPosition.equals(this.position.value)) {
      return
    }
    this.position.value = newPosition

    if (!this.selectionComposable.selection.value.contains(newPosition)) {
      this.selectionComposable.updateSelection(CellRange.fromSingleCellId(newPosition))
    }
  }

  public movePosition(dir: Direction, wrap = false) {
    const selection = this.selectionComposable.selection.value
    const range = wrap && selection.size() > 1 ? selection : this.gridRange.value

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

  public autoSetRowHeight(rows: RowIdString[]) {
    rows.forEach((rowId) => {
      const rowIndex = Row.getRowIndexFromId(rowId)
      const cells = this.getRowCells(rowIndex)

      const maxLineHeight = cells.reduce((acc, cell) => {
        if (!cell.display.value) {
          return acc
        }
        const lineHeight = getLineHeight(cell.style.value.fontSize)
        return lineHeight > acc ? lineHeight : acc
      }, 0)

      this.rowsAndColsComposable.rows.value[rowIndex].height.value = Math.max(maxLineHeight, defaultRowHeight)
    })
  }

  public autoSetRowHeightByTarget(id?: CellId | string) {
    const cellIds = id
      ? [CellId.isCellId(id) ? id : CellId.fromId(id)]
      : this.selectionComposable.selection.value.getAllCellIds()

    const rowIds = cellIds
      .filter(cellId => this.getCell(cellId)?.display.value)
      .reduce((acc: RowIdString[], cellId) => {
        const rowIndex = Row.getRowIdFromIndex(cellId.rowIndex)
        if (!acc.includes(rowIndex)) {
          acc.push(rowIndex)
        }
        return acc
      }, [])
    this.autoSetRowHeight(rowIds)
  }

  public autoSetColWidth(cols: ColIdString[]) {
    cols.forEach((colId) => {
      const colIndex = Col.getColIndexFromId(colId)
      const cells = this.rowsAndColsComposable.getCellIdsFromColIndex(colIndex)
        .map(cellId => this.getCell(cellId))

      const newColWidth = cells.reduce((acc, cell) => {
        if (!cell.display.value) {
          return acc
        }
        const elem = document.getElementById(cell.cellId.id)
        if (!elem) {
          return acc
        }
        const context = document.createElement('canvas').getContext('2d')
        if (!context) {
          return acc
        }
        const computedStyle = window.getComputedStyle(elem)
        context.font = `${computedStyle.fontWeight} ${computedStyle.fontStyle} ${computedStyle.fontSize} ${computedStyle.fontFamily}`
        const metrics = context.measureText(cell.display.value)
        const colWidth = metrics.width + 10 // Adding some padding
        return colWidth > acc ? colWidth : acc
      }, 0)

      if (newColWidth === 0) {
        return
      }

      this.rowsAndColsComposable.cols.value[colIndex].width.value = newColWidth
    })
  }

  public getRowCells(rowIndex: number): Cell[] {
    const startCellId = CellId.fromCoords(rowIndex, 0)
    const endCellId = CellId.fromCoords(rowIndex, this.rowsAndColsComposable.cols.value.length - 1)
    const range = CellRange.fromCellIds(startCellId, endCellId)
    return range
      .getAllCellIds()
      .flatMap(cellId => this.getCell(cellId) ?? [])
  }

  public resetSelection() {
    this.selectionComposable.select(this.position.value)
  }
}
