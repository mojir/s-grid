import { Cell } from '../Cell'
import { CellStyle } from '../CellStyle'
import { Col } from '../Col'
import type { Color } from '../color'
import { defaultColWidth, defaultRowHeight, getLineHeight } from '../constants'
import type { GridProject } from '../GridProject'
import { CellLocator } from '../locator/CellLocator'
import type { ColLocator } from '../locator/ColLocator'
import type { ColRangeLocator } from '../locator/ColRangeLocator'
import { getLocatorFromString, type Locator } from '../locator/Locator'
import { RangeLocator } from '../locator/RangeLocator'
import type { RowLocator } from '../locator/RowLocator'
import type { RowRangeLocator } from '../locator/RowRangeLocator'
import { getDocumentCellId, type Direction, type Movement } from '../locator/utils'
import { matrixFilter } from '../matrix'
import { Row } from '../Row'
import { GridSelection } from './GridSelection'
import { GridAlias } from '~/lib/Grid/GridAlias'
import { CellEditor } from '~/lib/Grid/CellEditor'
import type { CellStyleName } from '~/dto/CellStyleDTO'
import type { GridDTO } from '~/dto/GridDTO'

export class Grid {
  private gridProject: GridProject
  public readonly name: Ref<string>
  public readonly alias: GridAlias
  public readonly selection: GridSelection
  public rows: Ref<Row[]>
  public cols: Ref<Col[]>
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
    this.editor = new CellEditor(name)
    this.selection = new GridSelection(this)
    this.alias = new GridAlias()
    this.position = ref(CellLocator.fromCoords(this.name.value, { row: 0, col: 0 }))

    this.cells = Array.from({ length: this.rows.value.length }, (_, row) =>
      Array.from({ length: this.cols.value.length }, (_, col) =>
        new Cell(CellLocator.fromCoords(this.name.value, { row, col }),
          {
            gridProject: this.gridProject,
            grid: this,
            commandCenter: this.gridProject.commandCenter,
          },
        ),
      ),
    )
    this.gridRange = computed(() => RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this.name.value, { row: 0, col: 0 }),
      CellLocator.fromCoords(this.name.value, { row: this.rows.value.length - 1, col: this.cols.value.length - 1 }),
    ))
  }

  static fromDTO(gridProject: GridProject, grid: GridDTO): Grid {
    const newGrid = new Grid(gridProject, grid.name)
    newGrid.rows.value = Array.from({ length: grid.rows }, (_, row) => new Row(row, defaultRowHeight))
    newGrid.cols.value = Array.from({ length: grid.cols }, (_, col) => new Col(col, defaultColWidth))

    Object.entries(grid.cells).forEach(([key, cell]) => {
      // TODO use new regexp, to avoid the need of Locator
      const cellLocator = getLocatorFromString(grid.name, key) as CellLocator
      const gridCell = newGrid.cells[cellLocator.row][cellLocator.col]
      if (cell.input !== undefined) {
        gridCell.input.value = cell.input
      }
      if (cell.formatter !== undefined) {
        gridCell.formatter.value = cell.formatter
      }
      if (cell.style !== undefined) {
        gridCell.style.value = CellStyle.fromJson(cell.style)
      }
      // TODO fix colors
    })
    return newGrid
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
    return this.gridProject.getCellFromLocator(this.position.value)
  }

  public clear(locator: Locator | null) {
    this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
      .forEach((cell) => {
        cell.clear()
      })
  }

  public clearAllCells() {
    this.gridRange.value.getAllCellLocators().forEach((cellLocator) => {
      this.gridProject.getCellFromLocator(cellLocator).clear()
    })
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
    this.gridProject.getCellsFromLocator(locator)
      .forEach((cell) => {
        cell.input.value = input
      })
  }

  public setBackgroundColor(color: Color | null, locator: Locator | null): void {
    this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.backgroundColor.value = color
    })
  }

  public getBackgroundColor(locator: Locator | null): Color | null {
    const cells = this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const color = cells[0]?.backgroundColor.value ?? null

    return cells.slice(1).every(cell => cell.backgroundColor.value === color) ? color : null
  }

  public setTextColor(color: Color | null, locator: Locator | null): void {
    this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.textColor.value = color
    })
  }

  public getTextColor(locator: Locator | null): Color | null {
    const cells = this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const color = cells[0]?.textColor.value ?? null

    return cells.slice(1).every(cell => cell.textColor.value === color) ? color : null
  }

  public setStyle<T extends CellStyleName>(property: T, value: CellStyle[T], locator: Locator | null): void {
    this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.style.value[property] = value
    })
  }

  public getStyle<T extends CellStyleName>(property: T, locator: Locator | null): CellStyle[T] {
    const cells = this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const styleValue = cells[0]?.style.value[property]

    return cells.slice(1).every(cell => cell.style.value[property] === styleValue) ? styleValue : undefined
  }

  public setFormatter(formatter: string | null, locator: Locator | null): void {
    this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.formatter.value = formatter
    })
  }

  public getFormatter(locator: Locator | null): string | null {
    const cells = this.gridProject.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const formatter = cells[0]?.formatter.value ?? null

    return cells.slice(1).every(cell => cell.formatter.value === formatter) ? formatter : null
  }

  public setRowHeight(height: number, locator: Locator | null): void {
    locator = locator ?? this.selection.selectedRange.value
    this.gridProject.getRowsFromLocator(locator).forEach((row) => {
      row.height.value = height
    })
  }

  public setColWidth(width: number, locator: Locator | null): void {
    locator = locator ?? this.selection.selectedRange.value
    this.gridProject.getColsFromLocator(locator).forEach((col) => {
      col.width.value = width
    })
  }

  public getRow(rowLocator: RowLocator): Row {
    if (rowLocator.gridName !== this.name.value) {
      throw new Error(`Row ${rowLocator.toStringWithGrid()} is not in grid ${this.name.value}`)
    }

    const row = this.rows.value[rowLocator.row]

    if (!row) {
      throw new Error(`Row ${rowLocator.toStringWithGrid()} not found`)
    }
    return row
  }

  public getCol(colLocator: ColLocator): Col {
    if (colLocator.gridName !== this.name.value) {
      throw new Error(`Col ${colLocator.toStringWithGrid()} is not in grid ${this.name.value}`)
    }
    const col = this.cols.value[colLocator.col]

    if (!col) {
      throw new Error(`Col ${colLocator.toStringWithGrid()} not found`)
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

  public autoSetRowHeightByTarget(target?: CellLocator) {
    const cellIds = target
      ? [target]
      : this.selection.selectedRange.value.getAllCellLocators()

    const rowIds = cellIds
      .filter(cellLocator => this.gridProject.getCellFromLocator(cellLocator)?.display.value)
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
        .map(cellLocator => this.gridProject.getCellFromLocator(cellLocator))

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
    const startCellId = CellLocator.fromCoords(this.name.value, { row, col: 0 })
    const endCellId = CellLocator.fromCoords(this.name.value, { row, col: this.cols.value.length - 1 })
    const range = RangeLocator.fromCellLocators(startCellId, endCellId)
    return range
      .getAllCellLocators()
      .flatMap(cellLocator => this.gridProject.getCellFromLocator(cellLocator) ?? [])
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
        cell.cellLocator = CellLocator.fromCoords(this.name.value, { row: index, col })
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

    this.gridProject.transformAllLocators(
      {
        sourceGrid: this.name.value,
        type: 'rowDelete',
        rowRangeLocator,
      },
    )

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
        cell.cellLocator = CellLocator.fromCoords(this.name.value, { row: index, col })

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

    this.gridProject.transformAllLocators(
      {
        sourceGrid: this.name.value,
        type: 'colDelete',
        colRangeLocator,
      },
    )

    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selectedRange.value.start
  }

  public insertRowsBefore(rowRangeLocator: RowRangeLocator) {
    rowRangeLocator = rowRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this.name.value, { row: rowRangeLocator.start.row, col: 0 }),
      CellLocator.fromCoords(this.name.value, { row: rowRangeLocator.end.row, col: this.cols.value.length - 1 }),
    )
    this.gridProject.clipboard.copyStyleSelection(range)
    this.insertRows(rowRangeLocator)
    this.gridProject.clipboard.pasteStyleSelection(range)
  }

  public insertRowsAfter(rowRangeLocator: RowRangeLocator) {
    rowRangeLocator = rowRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this.name.value, { row: rowRangeLocator.start.row, col: 0 }),
      CellLocator.fromCoords(this.name.value, { row: rowRangeLocator.end.row, col: this.cols.value.length - 1 }),
    )
    this.gridProject.clipboard.copyStyleSelection(range)

    this.insertRows(rowRangeLocator.move(rowRangeLocator.size()))
    const movement: Movement = {
      toGrid: this.name.value,
      deltaRow: rowRangeLocator.size(),
      deltaCol: 0,
    }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.gridProject.clipboard.pasteStyleSelection(range.move(movement))
  }

  private getCellIdsFromColIndex(col: number): CellLocator[] {
    const startCellId = CellLocator.fromCoords(this.name.value, { row: 0, col })
    const endCellId = CellLocator.fromCoords(this.name.value, { row: this.rows.value.length - 1, col })
    return RangeLocator.fromCellLocators(startCellId, endCellId).getAllCellLocators()
  }

  private insertRows(rowRangeLocator: RowRangeLocator) {
    const row = rowRangeLocator.start.row
    const count = rowRangeLocator.size()
    const createdRows = Array.from({ length: count }, (_, index) => {
      const rowInstance = new Row(row + index, defaultRowHeight)
      this.cells.splice(row + index, 0, Array.from({ length: this.cols.value.length }, (_, col) =>
        new Cell(
          CellLocator.fromCoords(this.name.value, { row: row + index, col }),
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
        cell.cellLocator = CellLocator.fromCoords(this.name.value, { row: index, col })
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

    this.gridProject.transformAllLocators(
      {
        sourceGrid: this.name.value,
        type: 'rowInsertBefore',
        rowRangeLocator,
      },
    )

    this.rows.value = newRows
  }

  public insertColsBefore(colRangeLocator: ColRangeLocator) {
    colRangeLocator = colRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this.name.value, { row: 0, col: colRangeLocator.start.col }),
      CellLocator.fromCoords(this.name.value, { row: this.rows.value.length - 1, col: colRangeLocator.end.col }),
    )

    this.gridProject.clipboard.copyStyleSelection(range)
    this.insertCols(colRangeLocator)
    this.gridProject.clipboard.pasteStyleSelection(range)
  }

  public insertColsAfter(colRangeLocator: ColRangeLocator) {
    colRangeLocator = colRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this.name.value, { row: 0, col: colRangeLocator.start.col }),
      CellLocator.fromCoords(this.name.value, { row: this.rows.value.length - 1, col: colRangeLocator.end.col }),
    )
    this.insertCols(colRangeLocator.move(colRangeLocator.size()))
    const movement: Movement = {
      toGrid: this.name.value,
      deltaRow: 0,
      deltaCol: colRangeLocator.size(),
    }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.gridProject.clipboard.pasteStyleSelection(range.move(movement))
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
          CellLocator.fromCoords(this.name.value, { row, col: col + index }),
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
        cell.cellLocator = CellLocator.fromCoords(this.name.value, { row, col: index })
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

    this.gridProject.transformAllLocators(
      {
        sourceGrid: this.name.value,
        type: 'colInsertBefore',
        colRangeLocator,
      },
    )

    this.cols.value = newCols
  }
}
