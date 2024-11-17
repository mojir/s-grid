import { Cell } from '../Cell'
import { CellId, type Movement } from '../CellId'
import { CellRange } from '../CellRange'
import { CellStyle, getLineHeight, type CellStyleName } from '../CellStyle'
import { Col, type ColIdString, type ColRange } from '../Col'
import type { Color } from '../color'
import { matrixFilter, matrixForEach, matrixMap } from '../matrix'
import { Row, type RowIdString, type RowRange } from '../Row'
import { transformGridReference } from '../transformFormula'
import type { CellOrRangeTarget, CellTarget } from '../utils'
import { createGridClipboard, type GridClipboard } from './createGridClipboard'
import type { SelectionComposable } from '~/composables/useSelection'
import type { RowsAndColsComposable } from '~/composables/useRowsAndCols'
import type { LitsComposable } from '~/composables/useLits'
import type { AliasComposable } from '~/composables/useAlias'

export class Grid {
  private readonly rowsAndCols: RowsAndColsComposable
  private readonly selection: SelectionComposable
  private readonly alias: AliasComposable
  private readonly lits: LitsComposable
  private readonly commandCenter: CommandCenterComposable

  public readonly clipboard: GridClipboard
  public readonly cells: Cell[][]
  public readonly position: Ref<CellId>
  public readonly gridRange: ComputedRef<CellRange>

  constructor(
    {
      rowsAndCols,
      selection,
      alias,
      lits,
      commandCenter,
    }: {
      rowsAndCols: RowsAndColsComposable
      selection: SelectionComposable
      alias: AliasComposable
      lits: LitsComposable
      commandCenter: CommandCenterComposable
    },
  ) {
    this.rowsAndCols = rowsAndCols
    this.selection = selection
    this.alias = alias
    this.lits = lits
    this.commandCenter = commandCenter
    this.clipboard = createGridClipboard(this)
    this.position = ref(CellId.fromCoords(0, 0))
    this.cells = Array.from({ length: rowsAndCols.rows.value.length }, (_, rowIndex) =>
      Array.from({ length: rowsAndCols.cols.value.length }, (_, colIndex) =>
        new Cell(CellId.fromCoords(rowIndex, colIndex), { grid: this, lits, commandCenter, alias }),
      ),
    )
    this.gridRange = computed(() => CellRange.fromDimensions(0, 0, rowsAndCols.rows.value.length - 1, rowsAndCols.cols.value.length - 1))
  }

  public setInput(input: string, target?: CellOrRangeTarget) {
    this.getCells(target).forEach((cell) => {
      cell.input.value = input
    })
  }

  private getCellId(target?: CellTarget): CellId {
    if (target === undefined) {
      return this.selection.selection.value.start
    }

    if (CellId.isCellId(target)) {
      return target
    }
    const cell = this.alias.getCell(target)
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
      return this.selection.selection.value.getAllCellIds().map(cellId => this.getCell(cellId))
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
      const aliasCell = this.alias.getCell(target)
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

    if (!this.selection.selection.value.contains(newPosition)) {
      this.selection.updateSelection(CellRange.fromSingleCellId(newPosition))
    }
  }

  public movePosition(dir: Direction, wrap = false) {
    const selection = this.selection.selection.value
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

      this.rowsAndCols.rows.value[rowIndex].height.value = Math.max(maxLineHeight, defaultRowHeight)
    })
  }

  public autoSetRowHeightByTarget(id?: CellId | string) {
    const cellIds = id
      ? [CellId.isCellId(id) ? id : CellId.fromId(id)]
      : this.selection.selection.value.getAllCellIds()

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
      const cells = this.rowsAndCols.getCellIdsFromColIndex(colIndex)
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

      this.rowsAndCols.cols.value[colIndex].width.value = newColWidth
    })
  }

  public getRowCells(rowIndex: number): Cell[] {
    const startCellId = CellId.fromCoords(rowIndex, 0)
    const endCellId = CellId.fromCoords(rowIndex, this.rowsAndCols.cols.value.length - 1)
    const range = CellRange.fromCellIds(startCellId, endCellId)
    return range
      .getAllCellIds()
      .flatMap(cellId => this.getCell(cellId) ?? [])
  }

  public resetSelection() {
    this.selection.select(this.position.value)
  }

  public deleteRows(rowRange: RowRange) {
    const { rowIndex, count } = rowRange
    if (count === this.rowsAndCols.rows.value.length) {
      throw new Error('Cannot delete all rows')
    }

    const newRows = this.rowsAndCols.rows.value.filter((_, index) => index < rowIndex || index >= rowIndex + count)

    this.cells.splice(rowIndex, count).flat().forEach((cell) => {
      const aliasString = this.alias.cellRemoved(cell)

      if (aliasString) {
        const dependants = matrixFilter(this.cells, cell => cell.localReferences.value.includes(aliasString))

        dependants.forEach((dependantCell) => {
          const input = dependantCell.input.value
          dependantCell.input.value = ''
          dependantCell.input.value = input
        })
      }
    })

    for (let index = rowIndex; index < newRows.length; index++) {
      const row = newRows[index]
      row.index.value = index

      this.cells[index].forEach((cell, colIndex) => {
        cell.cellId = CellId.fromCoords(index, colIndex)
        const aliasString = this.alias.getAlias(cell)

        if (aliasString) {
          const dependants = matrixFilter(this.cells, cell => cell.localReferences.value.includes(aliasString))

          dependants.forEach((dependantCell) => {
            const input = dependantCell.input.value
            dependantCell.input.value = ''
            dependantCell.input.value = input
          })
        }
      })
    }

    this.rowsAndCols.rows.value = newRows

    matrixForEach(this.cells, (cell) => {
      if (cell.input.value.startsWith('=')) {
        cell.input.value = `=${transformGridReference(
          cell.input.value.slice(1),
          {
            type: 'rowDelete',
            rowRange: {
              rowIndex,
              count,
            },
          },
        )}`
      }
    })

    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selection.value.start
  }

  public deleteCols(colRange: ColRange) {
    const { colIndex, count } = colRange
    if (count === this.rowsAndCols.cols.value.length) {
      throw new Error('Cannot delete all columns')
    }

    const newCols = this.rowsAndCols.cols.value.filter((_, index) => index < colIndex || index >= colIndex + count)

    this.cells.reduce((acc: Cell[], row) => {
      return [...acc, ...row.splice(colIndex, count)]
    }, []).forEach((cell) => {
      const aliasString = this.alias.cellRemoved(cell)

      if (aliasString) {
        const dependants = matrixFilter(this.cells, cell => cell.localReferences.value.includes(aliasString))

        dependants.forEach((dependantCell) => {
          const input = dependantCell.input.value
          dependantCell.input.value = ''
          dependantCell.input.value = input
        })
      }
    })

    for (let index = colIndex; index < newCols.length; index++) {
      const col = newCols[index]
      col.index.value = index

      this.cells[index].forEach((cell, colIndex) => {
        cell.cellId = CellId.fromCoords(index, colIndex)

        const aliasString = this.alias.getAlias(cell)

        if (aliasString) {
          const dependants = matrixFilter(this.cells, cell => cell.localReferences.value.includes(aliasString))

          dependants.forEach((dependantCell) => {
            const input = dependantCell.input.value
            dependantCell.input.value = ''
            dependantCell.input.value = input
          })
        }
      })
    }

    this.rowsAndCols.cols.value = newCols

    matrixForEach(this.cells, (cell) => {
      if (cell.input.value.startsWith('=')) {
        cell.input.value = `=${transformGridReference(
          cell.input.value.slice(1),
          {
            type: 'colDelete',
            colRange: {
              colIndex,
              count,
            },
          },
        )}`
      }
    })
    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selection.value.start
  }

  public insertRowsBefore(rowRange: RowRange) {
    const range = CellRange.fromDimensions(rowRange.rowIndex, 0, rowRange.rowIndex + rowRange.count - 1, this.rowsAndCols.cols.value.length - 1)
    this.clipboard.copyStyleSelection(range)
    this.insertRows(rowRange.rowIndex, rowRange.count)
    this.clipboard.pasteStyleSelection(range)
  }

  public insertRowsAfter(rowRange: RowRange) {
    const range = CellRange.fromDimensions(rowRange.rowIndex, 0, rowRange.rowIndex + rowRange.count - 1, this.rowsAndCols.cols.value.length - 1)
    this.clipboard.copyStyleSelection(range)
    const beforeIndex = rowRange.rowIndex + rowRange.count + 1
    this.insertRows(beforeIndex, rowRange.count)
    const movement: Movement = { rows: rowRange.count, cols: 0 }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selection.value.start
    this.clipboard.pasteStyleSelection(range.move(movement))
  }

  private insertRows(rowIndex: number, count = 1) {
    const createdRows = Array.from({ length: count }, (_, index) => {
      const row = Row.create(rowIndex + index, defaultRowHeight)
      this.cells.splice(rowIndex + index, 0, Array.from({ length: this.rowsAndCols.cols.value.length }, (_, colIndex) =>
        new Cell(
          CellId.fromCoords(rowIndex + index, colIndex),
          { grid: this, lits: this.lits, commandCenter: this.commandCenter, alias: this.alias },
        ),
      ))
      return row
    })

    const newRows = [
      ...this.rowsAndCols.rows.value.slice(0, rowIndex),
      ...createdRows,
      ...this.rowsAndCols.rows.value.slice(rowIndex),
    ]

    for (let index = rowIndex + count; index < newRows.length; index++) {
      const row = newRows[index]
      row.index.value = index

      this.cells[index].forEach((cell, colIndex) => {
        cell.cellId = CellId.fromCoords(index, colIndex)
        const aliasString = this.alias.getAlias(cell)

        if (aliasString) {
          const dependants = matrixFilter(this.cells, cell => cell.localReferences.value.includes(aliasString))

          dependants.forEach((dependantCell) => {
            const input = dependantCell.input.value
            dependantCell.input.value = ''
            dependantCell.input.value = input
          })
        }
      })
    }

    matrixForEach(this.cells, (cell) => {
      if (cell.input.value.startsWith('=')) {
        cell.input.value = `=${transformGridReference(
          cell.input.value.slice(1),
          {
            type: 'rowInsertBefore',
            rowRange: {
              rowIndex,
              count,
            },
          },
        )}`
      }
    })

    this.rowsAndCols.rows.value = newRows
  }

  public insertColsBefore(colRange: ColRange) {
    const range = CellRange.fromDimensions(0, colRange.colIndex, this.rowsAndCols.rows.value.length - 1, colRange.colIndex + colRange.count - 1)
    this.clipboard.copyStyleSelection(range)
    this.insertCols(colRange.colIndex, colRange.count)
    this.clipboard.pasteStyleSelection(range)
  }

  public insertColsAfter(colRange: ColRange) {
    const range = CellRange.fromDimensions(0, colRange.colIndex, this.rowsAndCols.rows.value.length - 1, colRange.colIndex + colRange.count - 1)
    this.clipboard.copyStyleSelection(range)
    const beforeIndex = colRange.colIndex + colRange.count + 1
    this.insertCols(beforeIndex, colRange.count)
    const movement: Movement = { rows: 0, cols: colRange.count }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selection.value.start
    this.clipboard.pasteStyleSelection(range.move(movement))
  }

  private insertCols(colIndex: number, count = 1) {
    const createdCols = Array.from({ length: count }, (_, index) => {
      return Col.create(colIndex + index, defaultColWidth)
    })

    const newCols = [
      ...this.rowsAndCols.cols.value.slice(0, colIndex),
      ...createdCols,
      ...this.rowsAndCols.cols.value.slice(colIndex),
    ]

    this.cells.forEach((cellRow, rowIndex) => {
      cellRow.splice(colIndex, 0, ...Array.from({ length: count }, (_, index) =>
        new Cell(
          CellId.fromCoords(rowIndex, colIndex + index),
          { grid: this, lits: this.lits, commandCenter: this.commandCenter, alias: this.alias },
        ),
      ))
    })

    for (let index = colIndex + count; index < newCols.length; index++) {
      const col = newCols[index]
      col.index.value = index
    }

    for (let rowIndex = 0; rowIndex < this.cells.length; rowIndex++) {
      for (let index = colIndex + count; index < newCols.length; index++) {
        const cell = this.cells[rowIndex][index]
        cell.cellId = CellId.fromCoords(rowIndex, index)
        const aliasString = this.alias.getAlias(cell)

        if (aliasString) {
          const dependants = matrixFilter(this.cells, cell => cell.localReferences.value.includes(aliasString))

          dependants.forEach((dependantCell) => {
            const input = dependantCell.input.value
            dependantCell.input.value = ''
            dependantCell.input.value = input
          })
        }
      }
    }

    matrixForEach(this.cells, (cell) => {
      if (cell.input.value.startsWith('=')) {
        cell.input.value = `=${transformGridReference(
          cell.input.value.slice(1),
          {
            type: 'colInsertBefore',
            colRange: {
              colIndex,
              count,
            },
          },
        )}`
      }
    })

    this.rowsAndCols.cols.value = newCols
  }
}
