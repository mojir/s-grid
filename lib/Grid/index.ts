import { Cell } from '../Cell'
import type { CellStyle, CellStyleName } from '../CellStyle'
import { Col } from '../Col'
import type { Color } from '../color'
import { defaultColWidth, defaultRowHeight, getLineHeight } from '../constants'
import type { GridProject } from '../GridProject'
import { CellLocator, isCellLocatorString } from '../locator/CellLocator'
import { ColLocator } from '../locator/ColLocator'
import { ColRangeLocator } from '../locator/ColRangeLocator'
import type { Locator } from '../locator/Locator'
import { RangeLocator } from '../locator/RangeLocator'
import { RowLocator } from '../locator/RowLocator'
import { RowRangeLocator } from '../locator/RowRangeLocator'
import { getDocumentCellId, type Direction, type Movement } from '../locator/utils'
import { matrixFilter, matrixForEach, matrixMap } from '../matrix'
import { Row } from '../Row'
import { transformGridReference } from '../transformFormula'
import { GridClipboard } from './GridClipboard'
import { GridSelection } from './GridSelection'
import { GridAlias } from '~/lib/Grid/GridAlias'
import { CellEditor } from '~/lib/Grid/CellEditor'

export class Grid {
  private gridProject: GridProject
  public readonly name: Ref<string>
  public readonly alias: GridAlias
  public readonly selection: GridSelection
  public rows: Ref<Row[]>
  public cols: Ref<Col[]>
  public readonly clipboard: GridClipboard
  public readonly cells: Cell[][]
  public readonly position: Ref<CellLocator>
  public readonly gridRange: ComputedRef<RangeLocator>
  public readonly editor: CellEditor
  public hoveredCell = ref<CellLocator | null>(null)
  private scrollPosition = { scrollTop: 0, scrollLeft: 0 }

  constructor(gridProject: GridProject, name: string) {
    this.name = ref(name)
    this.gridProject = gridProject
    this.rows = shallowRef(Array.from({ length: 50 }, (_, row) => new Row(row, defaultRowHeight)))
    this.cols = shallowRef(Array.from({ length: 26 }, (_, col) => new Col(col, defaultColWidth)))
    this.editor = new CellEditor()
    this.selection = new GridSelection(this)
    this.alias = new GridAlias()
    this.clipboard = new GridClipboard(this)
    this.position = ref(CellLocator.fromCoords({ row: 0, col: 0 }))

    this.cells = Array.from({ length: this.rows.value.length }, (_, row) =>
      Array.from({ length: this.cols.value.length }, (_, col) =>
        new Cell(CellLocator.fromCoords({ row, col }),
          {
            gridProject: this.gridProject,
            grid: this,
            commandCenter: this.gridProject.commandCenter,
          },
        ),
      ),
    )
    this.gridRange = computed(() => RangeLocator.fromCellLocators(
      CellLocator.fromCoords({ row: 0, col: 0 }),
      CellLocator.fromCoords({ row: this.rows.value.length - 1, col: this.cols.value.length - 1 }),
    ))
  }

  public setScrollPosition(value: { scrollTop?: number, scrollLeft?: number }) {
    if (value.scrollTop !== undefined) {
      this.scrollPosition.scrollTop = value.scrollTop
    }
    if (value.scrollLeft !== undefined) {
      this.scrollPosition.scrollLeft = value.scrollLeft
    }
  }

  public getScrollPosition() {
    return this.scrollPosition
  }

  public setScrollLeft(scrollLeft: number) {
    this.scrollPosition.scrollLeft = scrollLeft
  }

  public getCurrentCell(): Cell {
    return this.getCellFromLocator(this.position.value)
  }

  public getCellFromLocator(cellLocator: CellLocator | null): Cell {
    cellLocator = cellLocator ?? this.position.value
    const cell = this.cells[cellLocator.row][cellLocator.col]
    if (!cell) {
      throw new Error(`Cell ${cellLocator.toString()} is out of range`)
    }

    return cell
  }

  public getCellsFromLocator(locator: Locator): Cell[] {
    return locator instanceof RangeLocator
      ? locator.getAllCellLocators().map(cellLocator => this.getCellFromLocator(cellLocator))
      : locator instanceof RowLocator
        ? locator.getAllCellLocators(this.cols.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
        : locator instanceof ColLocator
          ? locator.getAllCellLocators(this.rows.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
          : locator instanceof RowRangeLocator
            ? locator.getAllCellLocators(this.cols.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
            : locator instanceof ColRangeLocator
              ? locator.getAllCellLocators(this.rows.value.length).map(cellLocator => this.getCellFromLocator(cellLocator))
              : [this.getCellFromLocator(locator)]
  }

  private getCellFromString(locatorString: string): Cell | null {
    const aliasCell = this.alias.getCell(locatorString)
    if (aliasCell) {
      return aliasCell
    }
    if (isCellLocatorString(locatorString)) {
      return this.getCellFromLocator(CellLocator.fromString(locatorString))
    }

    return null
  }

  public getRowsFromLocator(locator: Locator): Row[] {
    const rowLocators: RowLocator[] = locator instanceof RangeLocator
      ? locator.getAllRowLocators()
      : locator instanceof RowLocator
        ? [locator]
        : locator instanceof ColLocator || locator instanceof ColRangeLocator
          ? this.gridRange.value.getAllRowLocators()
          : locator instanceof RowRangeLocator
            ? locator.getAllRowLocators()
            : [
                new RowLocator({
                  externalGrid: null,
                  absRow: false,
                  row: locator.row,
                }),
              ]

    return rowLocators.map((rowLocator) => {
      if (rowLocator.externalGrid !== null) {
        throw new Error('External grid not supported')
      }
      return this.rows.value[rowLocator.row]
    })
  }

  public getColsFromLocator(locator: Locator): Col[] {
    const colLocators: ColLocator[] = locator instanceof RangeLocator
      ? locator.getAllColLocators()
      : locator instanceof ColLocator
        ? [locator]
        : locator instanceof RowLocator || locator instanceof RowRangeLocator
          ? this.gridRange.value.getAllColLocators()
          : locator instanceof ColRangeLocator
            ? locator.getAllColLocators()
            : [
                new ColLocator({
                  externalGrid: null,
                  absCol: false,
                  col: locator.col,
                }),
              ]

    return colLocators.map((colLocator) => {
      if (colLocator.externalGrid !== null) {
        throw new Error('External grid not supported')
      }
      return this.cols.value[colLocator.col]
    })
  }

  public clear(locator: Locator | null) {
    this.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
      .forEach((cell) => {
        cell.clear()
      })
  }

  public clearAllCells() {
    this.gridRange.value.getAllCellLocators().forEach((cellLocator) => {
      this.getCellFromLocator(cellLocator).clear()
    })
  }

  public getValueFromLocator(locator: Locator): unknown {
    if (locator instanceof RangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof RowLocator) {
      return locator
        .getAllCellLocators(this.cols.value.length)
        .map(cellLocator => this.getCellFromLocator(cellLocator).output.value)
    }
    else if (locator instanceof ColLocator) {
      return locator
        .getAllCellLocators(this.cols.value.length)
        .map(cellLocator => this.getCellFromLocator(cellLocator).output.value)
    }
    else if (locator instanceof RowRangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(this.cols.value.length),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof ColRangeLocator) {
      return matrixMap(
        locator.getCellIdMatrix(this.rows.value.length),
        cellLocator => this.getCellFromLocator(cellLocator).output.value,
      )
    }
    else if (locator instanceof CellLocator) {
      return this.getCellFromLocator(locator).output.value
    }
  }

  public movePositionTo(cellLocator: CellLocator) {
    const newPosition = cellLocator.clamp(this.gridRange.value)
    if (newPosition.isSameCell(this.position.value)) {
      return
    }
    this.position.value = newPosition

    if (!this.selection.selectedRange.value.containsCell(newPosition)) {
      this.selection.updateSelection(RangeLocator.fromCellLocator(newPosition))
    }
  }

  public movePosition(dir: Direction, wrap = false) {
    const selection = this.selection.selectedRange.value
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

  public setInput(input: string, locator: Locator | null) {
    locator = locator ?? this.selection.selectedRange.value
    this.getCellsFromLocator(locator)
      .forEach((cell) => {
        cell.input.value = input
      })
  }

  public setBackgroundColor(color: Color | null, locator: Locator | null): void {
    this.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.backgroundColor.value = color
    })
  }

  public getBackgroundColor(locator: Locator | null): Color | null {
    const cells = this.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const color = cells[0]?.backgroundColor.value ?? null

    return cells.slice(1).every(cell => cell.backgroundColor.value === color) ? color : null
  }

  public setTextColor(color: Color | null, locator: Locator | null): void {
    this.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.textColor.value = color
    })
  }

  public getTextColor(locator: Locator | null): Color | null {
    const cells = this.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const color = cells[0]?.textColor.value ?? null

    return cells.slice(1).every(cell => cell.textColor.value === color) ? color : null
  }

  public setStyle<T extends CellStyleName>(property: T, value: CellStyle[T], locator: Locator | null): void {
    this.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.style.value[property] = value
    })
  }

  public getStyle<T extends CellStyleName>(property: T, locator: Locator | null): CellStyle[T] {
    const cells = this.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const styleValue = cells[0]?.style.value[property]

    return cells.slice(1).every(cell => cell.style.value[property] === styleValue) ? styleValue : undefined
  }

  public setFormatter(formatter: string | null, locator: Locator | null): void {
    this.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.formatter.value = formatter
    })
  }

  public getFormatter(locator: Locator | null): string | null {
    const cells = this.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const formatter = cells[0]?.formatter.value ?? null

    return cells.slice(1).every(cell => cell.formatter.value === formatter) ? formatter : null
  }

  public setRowHeight(height: number, locator: Locator | null): void {
    locator = locator ?? this.selection.selectedRange.value
    this.getRowsFromLocator(locator).forEach((row) => {
      row.height.value = height
    })
  }

  public setColWidth(width: number, locator: Locator | null): void {
    locator = locator ?? this.selection.selectedRange.value
    this.getColsFromLocator(locator).forEach((col) => {
      col.width.value = width
    })
  }

  public getRow(id: string | RowLocator): Row {
    const rowLocator = id instanceof RowLocator ? id : RowLocator.fromString(id)
    const row = this.rows.value[rowLocator.row]

    if (!row) {
      throw new Error(`Row ${id} not found`)
    }
    return row
  }

  public getCol(id: string | ColLocator): Col {
    const colLocator = id instanceof ColLocator ? id : ColLocator.fromString(id)
    const col = this.cols.value[colLocator.col]

    if (!col) {
      throw new Error(`Col ${id} not found`)
    }
    return col
  }

  public getSelectedRowsWithRowId(rowLocator: RowLocator, selection: RangeLocator): Row[] {
    if (selection.start.col === 0 && selection.end.col === this.cols.value.length - 1) {
      const row = rowLocator.row
      if (row >= selection.start.row && row <= selection.end.row) {
        return this.rows.value.slice(selection.start.row, selection.end.row + 1)
      }
    }
    return []
  }

  public getSelectedColsWithColId(colLocator: ColLocator, selection: RangeLocator): Col[] {
    if (selection.start.row === 0 && selection.end.row === this.rows.value.length - 1) {
      const col = colLocator.col
      if (col >= selection.start.col && col <= selection.end.col) {
        return this.cols.value.slice(selection.start.col, selection.end.col + 1)
      }
    }
    return []
  }

  public autoSetRowHeight(rows: number[]) {
    rows.forEach((row) => {
      const cells = this.getRowCells(row)

      const maxLineHeight = cells.reduce((acc, cell) => {
        if (!cell.display.value) {
          return acc
        }
        const lineHeight = getLineHeight(cell.style.value.fontSize)
        return lineHeight > acc ? lineHeight : acc
      }, 0)

      this.rows.value[row].height.value = Math.max(maxLineHeight, defaultRowHeight)
    })
  }

  public autoSetRowHeightByTarget(target?: CellLocator | string) {
    const cellIds = target
      ? [target instanceof CellLocator ? target : CellLocator.fromString(target)]
      : this.selection.selectedRange.value.getAllCellLocators()

    const rowIds = cellIds
      .filter(cellLocator => this.getCellFromLocator(cellLocator)?.display.value)
      .reduce((acc: number[], cellLocator) => {
        if (!acc.includes(cellLocator.row)) {
          acc.push(cellLocator.row)
        }
        return acc
      }, [])
    this.autoSetRowHeight(rowIds)
  }

  public autoSetColWidth(cols: number[]) {
    cols.forEach((col) => {
      const cells = this.getCellIdsFromColIndex(col)
        .map(cellLocator => this.getCellFromLocator(cellLocator))

      const newColWidth = cells.reduce((acc, cell) => {
        if (!cell.display.value) {
          return acc
        }
        const elem = document.getElementById(getDocumentCellId(cell.cellLocator, this.name.value))
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

      this.cols.value[col].width.value = newColWidth
    })
  }

  public getRowCells(row: number): Cell[] {
    const startCellId = CellLocator.fromCoords({ row, col: 0 })
    const endCellId = CellLocator.fromCoords({ row, col: this.cols.value.length - 1 })
    const range = RangeLocator.fromCellLocators(startCellId, endCellId)
    return range
      .getAllCellLocators()
      .flatMap(cellLocator => this.getCellFromLocator(cellLocator) ?? [])
  }

  public resetSelection() {
    this.selection.select(this.position.value)
  }

  public deleteRows(rowRangeLocator: RowRangeLocator) {
    const row = rowRangeLocator.start.row
    const count = rowRangeLocator.size()
    if (count === this.rows.value.length) {
      throw new Error('Cannot delete all rows')
    }

    const newRows = this.rows.value.filter((_, index) => index < row || index >= row + count)

    this.cells.splice(row, count).flat().forEach((cell) => {
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

    for (let index = row; index < newRows.length; index++) {
      const row = newRows[index]
      row.index.value = index

      this.cells[index].forEach((cell, col) => {
        cell.cellLocator = CellLocator.fromCoords({ row: index, col })
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

    this.rows.value = newRows

    matrixForEach(this.cells, (cell) => {
      if (cell.input.value.startsWith('=')) {
        cell.input.value = `=${transformGridReference(
          cell.input.value.slice(1),
          {
            type: 'rowDelete',
            rowRangeLocator,
          },
        )}`
      }
    })

    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selectedRange.value.start
  }

  public deleteCols(colRangeLocator: ColRangeLocator) {
    const col = colRangeLocator.start.col
    const count = colRangeLocator.size()
    if (count === this.cols.value.length) {
      throw new Error('Cannot delete all columns')
    }

    const newCols = this.cols.value.filter((_, index) => index < col || index >= col + count)

    this.cells.reduce((acc: Cell[], row) => {
      return [...acc, ...row.splice(col, count)]
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

    for (let index = col; index < newCols.length; index++) {
      const col = newCols[index]
      col.index.value = index

      this.cells[index].forEach((cell, col) => {
        cell.cellLocator = CellLocator.fromCoords({ row: index, col })

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

    this.cols.value = newCols

    matrixForEach(this.cells, (cell) => {
      if (cell.input.value.startsWith('=')) {
        cell.input.value = `=${transformGridReference(
          cell.input.value.slice(1),
          {
            type: 'colDelete',
            colRangeLocator,
          },
        )}`
      }
    })
    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selectedRange.value.start
  }

  public insertRowsBefore(rowRangeLocator: RowRangeLocator) {
    rowRangeLocator = rowRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords({ row: rowRangeLocator.start.row, col: 0 }),
      CellLocator.fromCoords({ row: rowRangeLocator.end.row, col: this.cols.value.length - 1 }),
    )
    this.clipboard.copyStyleSelection(range)
    this.insertRows(rowRangeLocator)
    this.clipboard.pasteStyleSelection(range)
  }

  public insertRowsAfter(rowRangeLocator: RowRangeLocator) {
    rowRangeLocator = rowRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords({ row: rowRangeLocator.start.row, col: 0 }),
      CellLocator.fromCoords({ row: rowRangeLocator.end.row, col: this.cols.value.length - 1 }),
    )
    this.clipboard.copyStyleSelection(range)

    this.insertRows(rowRangeLocator.move(rowRangeLocator.size()))
    const movement: Movement = { rows: rowRangeLocator.size(), cols: 0 }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.clipboard.pasteStyleSelection(range.move(movement))
  }

  private getCellIdsFromColIndex(col: number): CellLocator[] {
    const startCellId = CellLocator.fromCoords({ row: 0, col })
    const endCellId = CellLocator.fromCoords({ row: this.rows.value.length - 1, col })
    return RangeLocator.fromCellLocators(startCellId, endCellId).getAllCellLocators()
  }

  private insertRows(rowRangeLocator: RowRangeLocator) {
    const row = rowRangeLocator.start.row
    const count = rowRangeLocator.size()
    const createdRows = Array.from({ length: count }, (_, index) => {
      const rowInstance = new Row(row + index, defaultRowHeight)
      this.cells.splice(row + index, 0, Array.from({ length: this.cols.value.length }, (_, col) =>
        new Cell(
          CellLocator.fromCoords({ row: row + index, col }),
          {
            gridProject: this.gridProject,
            grid: this,
            commandCenter: this.gridProject.commandCenter,
          },
        ),
      ))
      return rowInstance
    })

    const newRows = [
      ...this.rows.value.slice(0, row),
      ...createdRows,
      ...this.rows.value.slice(row),
    ]

    for (let index = row + count; index < newRows.length; index++) {
      const row = newRows[index]
      row.index.value = index

      this.cells[index].forEach((cell, col) => {
        cell.cellLocator = CellLocator.fromCoords({ row: index, col })
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
            rowRangeLocator,
          },
        )}`
      }
    })

    this.rows.value = newRows
  }

  public insertColsBefore(colRangeLocator: ColRangeLocator) {
    colRangeLocator = colRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords({ row: 0, col: colRangeLocator.start.col }),
      CellLocator.fromCoords({ row: this.rows.value.length - 1, col: colRangeLocator.end.col }),
    )

    this.clipboard.copyStyleSelection(range)
    this.insertCols(colRangeLocator)
    this.clipboard.pasteStyleSelection(range)
  }

  public insertColsAfter(colRangeLocator: ColRangeLocator) {
    colRangeLocator = colRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords({ row: 0, col: colRangeLocator.start.col }),
      CellLocator.fromCoords({ row: this.rows.value.length - 1, col: colRangeLocator.end.col }),
    )
    this.insertCols(colRangeLocator.move(colRangeLocator.size()))
    const movement: Movement = { rows: 0, cols: colRangeLocator.size() }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.clipboard.pasteStyleSelection(range.move(movement))
  }

  private insertCols(colRangeLocator: ColRangeLocator) {
    const col = colRangeLocator.start.col
    const count = colRangeLocator.size()
    const createdCols = Array.from({ length: count }, (_, index) => {
      return new Col(col + index, defaultColWidth)
    })

    const newCols = [
      ...this.cols.value.slice(0, col),
      ...createdCols,
      ...this.cols.value.slice(col),
    ]

    this.cells.forEach((cellRow, row) => {
      cellRow.splice(col, 0, ...Array.from({ length: count }, (_, index) =>
        new Cell(
          CellLocator.fromCoords({ row, col: col + index }),
          {
            gridProject: this.gridProject,
            grid: this,
            commandCenter: this.gridProject.commandCenter,
          },
        ),
      ))
    })

    for (let index = col + count; index < newCols.length; index++) {
      const col = newCols[index]
      col.index.value = index
    }

    for (let row = 0; row < this.cells.length; row++) {
      for (let index = col + count; index < newCols.length; index++) {
        const cell = this.cells[row][index]
        cell.cellLocator = CellLocator.fromCoords({ row, col: index })
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
            colRangeLocator,
          },
        )}`
      }
    })

    this.cols.value = newCols
  }
}
