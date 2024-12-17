import { Cell } from '../Cell'
import { CellStyle } from '../CellStyle'
import { Col } from '../Col'
import { Color } from '../color'
import { defaultColWidth, defaultRowHeight, getLineHeight } from '../constants'
import type { Project } from '../project/Project'
import { CellLocator } from '../locators/CellLocator'
import type { ColLocator } from '../locators/ColLocator'
import type { ColRangeLocator } from '../locators/ColRangeLocator'
import { RangeLocator } from '../locators/RangeLocator'
import type { RowLocator } from '../locators/RowLocator'
import type { RowRangeLocator } from '../locators/RowRangeLocator'
import { getDocumentCellId, type Direction, type Movement, type ReferenceLocator } from '../locators/utils'
import { matrixFilter } from '../matrix'
import { Row } from '../Row'
import { getGridName } from '../utils'
import { GridSelection } from './GridSelection'
import { CellEditor } from '~/lib/grid/CellEditor'
import type { GridDTO } from '~/dto/GridDTO'
import type { CellStyleName } from '~/dto/CellStyleDTO'

export class Grid {
  public project: Project
  public readonly hidden = ref(false)
  public readonly name: Ref<string>
  public readonly selection: GridSelection
  public rows: Ref<Row[]>
  public cols: Ref<Col[]>
  public readonly cells: Cell[][]
  public readonly currentCell: ComputedRef<Cell>
  public readonly position: Ref<CellLocator>
  public readonly gridRange: ComputedRef<RangeLocator>
  public readonly editor: CellEditor
  public hoveredCell = ref<CellLocator | null>(null)
  private scrollPosition = { scrollTop: 0, scrollLeft: 0 }

  constructor(project: Project, name: string, nbrOfRows: number, nbrOfCols: number) {
    this.name = ref(name)
    this.project = project
    this.rows = shallowRef(Array.from({ length: nbrOfRows }, (_, row) => new Row(row, defaultRowHeight)))
    this.cols = shallowRef(Array.from({ length: nbrOfCols }, (_, col) => new Col(col, defaultColWidth)))
    this.selection = new GridSelection(this.project, this)
    this.position = shallowRef(CellLocator.fromCoords(this, { row: 0, col: 0 }))
    this.editor = new CellEditor(this)

    this.cells = Array.from({ length: this.rows.value.length }, (_, row) =>
      Array.from({ length: this.cols.value.length }, (_, col) =>
        new Cell(CellLocator.fromCoords(this, { row, col }),
          {
            project: this.project,
            grid: this,
            commandCenter: this.project.commandCenter,
          },
        ),
      ),
    )
    this.gridRange = computed(() => RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this, { row: 0, col: 0 }),
      CellLocator.fromCoords(this, { row: this.rows.value.length - 1, col: this.cols.value.length - 1 }),
    ))
    this.currentCell = computed(() => this.project.locator.getCellFromLocator(this.position.value))
  }

  static fromDTO(project: Project, grid: GridDTO): Grid {
    const gridName = getGridName(grid.name)
    const newGrid = new Grid(project, gridName, grid.rows, grid.cols)
    if (grid.hidden !== undefined) {
      newGrid.hidden.value = grid.hidden
    }

    Object.entries(grid.cells).forEach(([key, cellDTO]) => {
      // TODO use new regexp, to avoid the need of Locator
      const cellLocator = CellLocator.fromString(newGrid, key) as CellLocator
      const cell = newGrid.cells[cellLocator.row][cellLocator.col]
      if (cellDTO.input !== undefined) {
        cell.input.value = cellDTO.input
      }
      if (cellDTO.formatter !== undefined) {
        cell.formatter.value = cellDTO.formatter
      }
      if (cellDTO.style !== undefined) {
        cell.style.value = CellStyle.fromDTO(cellDTO.style)
      }
      if (cellDTO.backgroundColor !== undefined) {
        cell.backgroundColor.value = cellDTO.backgroundColor ? Color.fromDTO(cellDTO.backgroundColor) : null
      }
      if (cellDTO.textColor !== undefined) {
        cell.textColor.value = cellDTO.textColor ? Color.fromDTO(cellDTO.textColor) : null
      }
    })
    Object.entries(grid.alias).forEach(([alias, key]) => {
      const cellLocator = CellLocator.fromString(newGrid, key) as CellLocator
      const cell = newGrid.cells[cellLocator.row][cellLocator.col]
      project.aliases.setCell(alias, cell)
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

  public clear(locator: ReferenceLocator | null) {
    this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
      .forEach((cell) => {
        cell.clear()
      })
  }

  public clearInput(locator: ReferenceLocator | null) {
    this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
      .forEach((cell) => {
        cell.input.value = ''
      })
  }

  public clearAllCells() {
    this.gridRange.value.getAllCellLocators().forEach((cellLocator) => {
      this.project.locator.getCellFromLocator(cellLocator).clear()
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
    this.movePositionTo(this.project.locator.locate(dir, this.position.value, range, wrap))
  }

  public setInput(input: string, locator: ReferenceLocator | null) {
    locator = locator ?? this.selection.selectedRange.value
    this.project.locator.getCellsFromLocator(locator)
      .forEach((cell) => {
        cell.input.value = input
      })
  }

  public setBackgroundColor(color: Color | null, locator: ReferenceLocator | null): void {
    this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.backgroundColor.value = color
    })
  }

  public getBackgroundColor(locator: ReferenceLocator | null): Color | null {
    const cells = this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const color = cells[0]?.backgroundColor.value ?? null

    return cells.slice(1).every(cell => cell.backgroundColor.value === color) ? color : null
  }

  public setTextColor(color: Color | null, locator: ReferenceLocator | null): void {
    this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.textColor.value = color
    })
  }

  public getTextColor(locator: ReferenceLocator | null): Color | null {
    const cells = this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const color = cells[0]?.textColor.value ?? null

    return cells.slice(1).every(cell => cell.textColor.value === color) ? color : null
  }

  public setStyle<T extends CellStyleName>(property: T, value: CellStyle[T], locator: ReferenceLocator | null): void {
    this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.style.value[property] = value
    })
  }

  public getStyle<T extends CellStyleName>(property: T, locator: ReferenceLocator | null): CellStyle[T] {
    const cells = this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const styleValue = cells[0]?.style.value[property]

    return cells.slice(1).every(cell => cell.style.value[property] === styleValue) ? styleValue : undefined
  }

  public setFormatter(formatter: string | null, locator: ReferenceLocator | null): void {
    this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value).forEach((cell) => {
      cell.formatter.value = formatter
    })
  }

  public getFormatter(locator: ReferenceLocator | null): string | null {
    const cells = this.project.locator.getCellsFromLocator(locator ?? this.selection.selectedRange.value)
    const formatter = cells[0]?.formatter.value ?? null

    return cells.slice(1).every(cell => cell.formatter.value === formatter) ? formatter : null
  }

  public setRowHeight(height: number, rowRangeLocator: RowRangeLocator | null): void {
    const locator = rowRangeLocator ?? this.selection.selectedRange.value
    this.project.locator.getRowsFromLocator(locator).forEach((row) => {
      row.height.value = height
    })
  }

  public setColWidth(width: number, colRangeLocator: ColRangeLocator | null): void {
    const locator = colRangeLocator ?? this.selection.selectedRange.value
    this.project.locator.getColsFromLocator(locator).forEach((col) => {
      col.width.value = width
    })
  }

  public getRow(rowLocator: RowLocator): Row {
    if (rowLocator.grid !== this) {
      throw new Error(`Row ${rowLocator.toStringWithGrid()} is not in grid ${this.name.value}`)
    }

    const row = this.rows.value[rowLocator.row]

    if (!row) {
      throw new Error(`Row ${rowLocator.toStringWithGrid()} not found`)
    }
    return row
  }

  public getCol(colLocator: ColLocator): Col {
    if (colLocator.grid !== this) {
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
        const nbrOfLines = cell.display.value.split('\n').length
        const lineHeight = getLineHeight(cell.style.value.fontSize) * nbrOfLines
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
      .filter(cellLocator => this.project.locator.getCellFromLocator(cellLocator)?.display.value)
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
        .map(cellLocator => this.project.locator.getCellFromLocator(cellLocator))

      const newColWidth = cells.reduce((acc, cell) => {
        if (!cell.display.value) {
          return acc
        }
        const elem = document.getElementById(getDocumentCellId(cell.cellLocator))
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
    const startCellId = CellLocator.fromCoords(this, { row, col: 0 })
    const endCellId = CellLocator.fromCoords(this, { row, col: this.cols.value.length - 1 })
    const range = RangeLocator.fromCellLocators(startCellId, endCellId)
    return range
      .getAllCellLocators()
      .flatMap(cellLocator => this.project.locator.getCellFromLocator(cellLocator) ?? [])
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
      const aliasString = this.project.aliases.cellRemoved(cell)

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
        cell.cellLocator = CellLocator.fromCoords(this, { row: index, col })
        const aliasString = this.project.aliases.getAlias(cell)

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

    this.project.transformAllLocators(
      {
        sourceGrid: this,
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
      const aliasString = this.project.aliases.cellRemoved(cell)

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
        cell.cellLocator = CellLocator.fromCoords(this, { row: index, col })

        const aliasString = this.project.aliases.getAlias(cell)

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

    this.project.transformAllLocators(
      {
        sourceGrid: this,
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
      CellLocator.fromCoords(this, { row: rowRangeLocator.start.row, col: 0 }),
      CellLocator.fromCoords(this, { row: rowRangeLocator.end.row, col: this.cols.value.length - 1 }),
    )
    this.project.clipboard.copyStyleSelection(range)
    this.insertRows(rowRangeLocator)
    this.project.clipboard.pasteStyleSelection(range)
  }

  public insertRowsAfter(rowRangeLocator: RowRangeLocator) {
    rowRangeLocator = rowRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this, { row: rowRangeLocator.start.row, col: 0 }),
      CellLocator.fromCoords(this, { row: rowRangeLocator.end.row, col: this.cols.value.length - 1 }),
    )
    this.project.clipboard.copyStyleSelection(range)

    this.insertRows(rowRangeLocator.move(rowRangeLocator.size()))
    const movement: Movement = {
      toGrid: this,
      deltaRow: rowRangeLocator.size(),
      deltaCol: 0,
    }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.project.clipboard.pasteStyleSelection(range.move(movement))
  }

  private getCellIdsFromColIndex(col: number): CellLocator[] {
    const startCellId = CellLocator.fromCoords(this, { row: 0, col })
    const endCellId = CellLocator.fromCoords(this, { row: this.rows.value.length - 1, col })
    return RangeLocator.fromCellLocators(startCellId, endCellId).getAllCellLocators()
  }

  private insertRows(rowRangeLocator: RowRangeLocator) {
    const row = rowRangeLocator.start.row
    const count = rowRangeLocator.size()
    const createdRows = Array.from({ length: count }, (_, index) => {
      const rowInstance = new Row(row + index, defaultRowHeight)
      this.cells.splice(row + index, 0, Array.from({ length: this.cols.value.length }, (_, col) =>
        new Cell(
          CellLocator.fromCoords(this, { row: row + index, col }),
          {
            project: this.project,
            grid: this,
            commandCenter: this.project.commandCenter,
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
        cell.cellLocator = CellLocator.fromCoords(this, { row: index, col })
        const aliasString = this.project.aliases.getAlias(cell)

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

    this.project.transformAllLocators(
      {
        sourceGrid: this,
        type: 'rowInsertBefore',
        rowRangeLocator,
      },
    )

    this.rows.value = newRows
  }

  public insertColsBefore(colRangeLocator: ColRangeLocator) {
    colRangeLocator = colRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this, { row: 0, col: colRangeLocator.start.col }),
      CellLocator.fromCoords(this, { row: this.rows.value.length - 1, col: colRangeLocator.end.col }),
    )

    this.project.clipboard.copyStyleSelection(range)
    this.insertCols(colRangeLocator)
    this.project.clipboard.pasteStyleSelection(range)
  }

  public insertColsAfter(colRangeLocator: ColRangeLocator) {
    colRangeLocator = colRangeLocator.toSorted()
    const range = RangeLocator.fromCellLocators(
      CellLocator.fromCoords(this, { row: 0, col: colRangeLocator.start.col }),
      CellLocator.fromCoords(this, { row: this.rows.value.length - 1, col: colRangeLocator.end.col }),
    )
    this.insertCols(colRangeLocator.move(colRangeLocator.size()))
    const movement: Movement = {
      toGrid: this,
      deltaRow: 0,
      deltaCol: colRangeLocator.size(),
    }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.project.clipboard.pasteStyleSelection(range.move(movement))
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
          CellLocator.fromCoords(this, { row, col: col + index }),
          {
            project: this.project,
            grid: this,
            commandCenter: this.project.commandCenter,
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
        cell.cellLocator = CellLocator.fromCoords(this, { row, col: index })
        const aliasString = this.project.aliases.getAlias(cell)

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

    this.project.transformAllLocators(
      {
        sourceGrid: this,
        type: 'colInsertBefore',
        colRangeLocator,
      },
    )

    this.cols.value = newCols
  }
}
