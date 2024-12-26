import { Cell } from '../Cell'
import { Col } from '../Col'
import { Color } from '../color'
import { defaultColWidth, defaultRowHeight, getLineHeight } from '../constants'
import type { Project } from '../project/Project'
import { CellReference } from '../reference/CellReference'
import { RangeReference } from '../reference/RangeReference'
import { getDocumentCellId, type Direction, type Movement, type Reference } from '../reference/utils'
import { Row } from '../Row'
import { getGridName } from '../utils'
import { GridSelection } from './GridSelection'
import { CellEditor } from '~/lib/grid/CellEditor'
import type { GridDTO } from '~/dto/GridDTO'
import type { StyleAlign, StyleFontSize, StyleJustify, StyleTextDecoration } from '~/dto/CellDTO'

export class Grid {
  public project: Project
  public readonly hidden = ref(false)
  public readonly name: Ref<string>
  public readonly selection: GridSelection
  public rows: Ref<Row[]>
  public cols: Ref<Col[]>
  public readonly cells: Cell[][]
  public readonly currentCell: ComputedRef<Cell>
  public readonly position: Ref<CellReference>
  public readonly gridRange: ComputedRef<RangeReference>
  public readonly editor: CellEditor
  public hoveredCell = ref<CellReference | null>(null)
  private scrollPosition = { scrollTop: 0, scrollLeft: 0 }

  constructor(project: Project, name: string, nbrOfRows: number, nbrOfCols: number) {
    this.name = ref(name)
    this.project = project
    this.rows = shallowRef(Array.from({ length: nbrOfRows }, (_, row) => new Row(this, row, defaultRowHeight)))
    this.cols = shallowRef(Array.from({ length: nbrOfCols }, (_, col) => new Col(this, col, defaultColWidth)))
    this.selection = new GridSelection(this.project, this)
    this.position = shallowRef(CellReference.fromCoords(this, { row: 0, col: 0 }))
    this.editor = new CellEditor(this)

    this.cells = Array.from({ length: this.rows.value.length }, (_, row) =>
      Array.from({ length: this.cols.value.length }, (_, col) =>
        new Cell(CellReference.fromCoords(this, { row, col }),
          {
            project: this.project,
            grid: this,
            commandCenter: this.project.commandCenter,
          },
        ),
      ),
    )
    this.gridRange = computed(() => RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { row: 0, col: 0 }),
      CellReference.fromCoords(this, { row: this.rows.value.length - 1, col: this.cols.value.length - 1 }),
    ))
    this.currentCell = computed(() => this.position.value.getCell())
  }

  static fromDTO(project: Project, grid: GridDTO): Grid {
    const gridName = getGridName(grid.name)
    const newGrid = new Grid(project, gridName, grid.rows, grid.cols)
    if (grid.hidden !== undefined) {
      newGrid.hidden.value = grid.hidden
    }

    Object.entries(grid.cells).forEach(([key, cellDTO]) => {
      // TODO use new regexp, to avoid the need of Reference
      const reference = CellReference.fromString(newGrid, key) as CellReference
      const cell = newGrid.cells[reference.row][reference.col]
      if (cellDTO.input !== undefined) {
        cell.input.value = cellDTO.input
      }
      if (cellDTO.formatter !== undefined) {
        cell.formatter.value = cellDTO.formatter
      }
      if (cellDTO.fontSize !== undefined) {
        cell.fontSize.value = cellDTO.fontSize
      }
      if (cellDTO.bold !== undefined) {
        cell.bold.value = cellDTO.bold
      }
      if (cellDTO.italic !== undefined) {
        cell.italic.value = cellDTO.italic
      }
      if (cellDTO.textDecoration !== undefined) {
        cell.textDecoration.value = cellDTO.textDecoration
      }
      if (cellDTO.justify !== undefined) {
        cell.justify.value = cellDTO.justify
      }
      if (cellDTO.align !== undefined) {
        cell.align.value = cellDTO.align
      }
      if (cellDTO.backgroundColor !== undefined) {
        cell.backgroundColor.value = cellDTO.backgroundColor ? Color.fromDTO(cellDTO.backgroundColor) : null
      }
      if (cellDTO.textColor !== undefined) {
        cell.textColor.value = cellDTO.textColor ? Color.fromDTO(cellDTO.textColor) : null
      }
    })
    Object.entries(grid.alias).forEach(([alias, key]) => {
      const reference = CellReference.fromString(newGrid, key) as CellReference
      project.aliases.setCell(alias, reference)
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

  public clear(reference: Reference | null) {
    reference ??= this.selection.selectedRange.value
    reference.getCells()
      .forEach((cell) => {
        cell.clear()
      })
  }

  public clearInput(reference: Reference | null) {
    reference ??= this.selection.selectedRange.value
    reference.getCells()
      .forEach((cell) => {
        cell.input.value = ''
      })
  }

  public clearAllCells() {
    this.gridRange.value.getAllCellReferences().forEach((reference) => {
      reference.getCell().clear()
    })
  }

  public movePositionTo(cellReference: CellReference) {
    const newPosition = cellReference.clamp(this.gridRange.value)
    if (newPosition.equals(this.position.value)) {
      return
    }
    this.position.value = newPosition

    if (!this.selection.selectedRange.value.containsCell(newPosition)) {
      const location = RangeReference.fromCellReference(newPosition)
      this.selection.updateSelection(location.start, location.end)
    }
  }

  public movePosition(dir: Direction, wrap = false) {
    const selection = this.selection.selectedRange.value
    const range = wrap && selection.size.value > 1 ? selection : this.gridRange.value
    this.movePositionTo(this.position.value.moveInDirection(dir, range, wrap))
  }

  public setInput(input: string, reference: Reference | null) {
    reference = reference ?? this.selection.selectedRange.value
    reference.getCells()
      .forEach((cell) => {
        cell.input.value = input
      })
  }

  public setBackgroundColor(color: Color | null, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.backgroundColor.value = color
    })
  }

  public getBackgroundColor(reference: Reference | null): Color | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const color = cells[0]?.backgroundColor.value ?? null

    return cells.slice(1).every((cell) => {
      const cellColor = cell.backgroundColor.value
      if (cellColor !== null && color !== null) {
        return cellColor.equals(color)
      }
      return cellColor === color
    })
      ? color
      : null
  }

  public setTextColor(color: Color | null, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.textColor.value = color
    })
  }

  public getTextColor(reference: Reference | null): Color | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const color = cells[0]?.textColor.value ?? null

    return cells.slice(1).every((cell) => {
      const cellColor = cell.textColor.value
      if (cellColor !== null && color !== null) {
        return cellColor.equals(color)
      }
      return cellColor === color
    })
      ? color
      : null
  }

  public setFontSize(fontSize: StyleFontSize, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.fontSize.value = fontSize
    })
  }

  public getFontSize(reference: Reference | null): StyleFontSize | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const fontSize = cells[0]?.fontSize.value

    return cells.slice(1).every(cell => cell.fontSize.value === fontSize) ? fontSize : null
  }

  public setBold(bold: boolean, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.bold.value = bold
    })
  }

  public getBold(reference: Reference | null): boolean | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const bold = cells[0]?.bold.value

    return cells.slice(1).every(cell => cell.bold.value === bold) ? bold : null
  }

  public setItalic(italic: boolean, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.italic.value = italic
    })
  }

  public getItalic(reference: Reference | null): boolean | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const italic = cells[0]?.italic.value

    return cells.slice(1).every(cell => cell.italic.value === italic) ? italic : null
  }

  public setTextDecoration(textDecoration: StyleTextDecoration, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.textDecoration.value = textDecoration
    })
  }

  public getTextDecoration(reference: Reference | null): StyleTextDecoration | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const textDecoration = cells[0]?.textDecoration.value

    return cells.slice(1).every(cell => cell.textDecoration.value === textDecoration) ? textDecoration : null
  }

  public setAlign(align: StyleAlign, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.align.value = align
    })
  }

  public getAlign(reference: Reference | null): StyleAlign | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const align = cells[0]?.align.value

    return cells.slice(1).every(cell => cell.align.value === align) ? align : null
  }

  public setJustify(justify: StyleJustify, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.justify.value = justify
    })
  }

  public getJustify(reference: Reference | null): StyleJustify | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const justify = cells[0]?.justify.value

    return cells.slice(1).every(cell => cell.justify.value === justify) ? justify : null
  }

  public setFormatter(formatter: string, reference: Reference | null): void {
    reference ??= this.selection.selectedRange.value
    reference.getCells().forEach((cell) => {
      cell.formatter.value = formatter
    })
  }

  public getFormatter(reference: Reference | null): string | null {
    reference ??= this.selection.selectedRange.value
    const cells = reference.getCells()
    const formatter = cells[0]?.formatter.value ?? null

    return cells.slice(1).every(cell => cell.formatter.value === formatter) ? formatter : null
  }

  public setRowHeight(height: number, rowIndex: RangeReference | null): void {
    const reference = rowIndex ?? this.selection.selectedRange.value
    reference.getAllRowIndices().forEach((row) => {
      this.rows.value[row].height.value = height
    })
  }

  public setColWidth(width: number, rangeReference: RangeReference | null): void {
    rangeReference ??= this.selection.selectedRange.value
    rangeReference.getAllColIndices().forEach((col) => {
      this.cols.value[col].width.value = width
    })
  }

  public getSelectedRowsWithRowIndex(rowIndex: number): number[] {
    const { start, end, grid } = this.selection.selectedRange.value

    if (
      grid === this
      && start.col === 0
      && end.col === this.cols.value.length - 1
      && rowIndex >= start.row
      && rowIndex <= end.row) {
      return this.rows.value.slice(start.row, end.row + 1).map(row => row.index.value)
    }

    return []
  }

  public getSelectedColsWithColIndex(col: number): number[] {
    const { start, end, grid } = this.selection.selectedRange.value
    if (
      grid === this
      && start.row === 0
      && end.row === this.rows.value.length - 1
      && col >= start.col && col <= end.col) {
      return this.cols.value.slice(start.col, end.col + 1).map(col => col.index.value)
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
        const lineHeight = getLineHeight(cell.fontSize.value) * nbrOfLines
        return lineHeight > acc ? lineHeight : acc
      }, 0)

      this.rows.value[row].height.value = Math.max(maxLineHeight, defaultRowHeight)
    })
  }

  public autoSetRowHeightByTarget(target?: CellReference) {
    const cellIds = target
      ? [target]
      : this.selection.selectedRange.value.getAllCellReferences()

    const rowIds = cellIds
      .filter(reference => reference.getCell().display.value)
      .reduce((acc: number[], reference) => {
        if (!acc.includes(reference.row)) {
          acc.push(reference.row)
        }
        return acc
      }, [])
    this.autoSetRowHeight(rowIds)
  }

  public autoSetColWidth(cols: number[]) {
    cols.forEach((col) => {
      const cells = this.getCellIdsFromColIndex(col)
        .map(reference => reference.getCell())

      const newColWidth = cells.reduce((acc, cell) => {
        if (!cell.display.value) {
          return acc
        }
        const elem = document.getElementById(getDocumentCellId(cell.cellReference))
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
    const startCellId = CellReference.fromCoords(this, { row, col: 0 })
    const endCellId = CellReference.fromCoords(this, { row, col: this.cols.value.length - 1 })
    const range = RangeReference.fromCellReferences(startCellId, endCellId)
    return range.getCells()
  }

  public resetSelection() {
    this.selection.select(this.position.value)
  }

  public deleteRows(row: number, count: number) {
    if (count === this.rows.value.length) {
      throw new Error('Cannot delete all rows')
    }

    this.cells.splice(row, count)

    this.rows.value = this.rows.value.filter((_, index) => index < row || index >= row + count)

    this.rows.value.forEach((row, index) => {
      row.index.value = index

      this.cells[index].forEach((cell, col) => {
        cell.cellReference = CellReference.fromCoords(this, { row: index, col })
      })
    })

    this.project.transformAllReferences({
      type: 'rowDelete',
      grid: this,
      row,
      count,
    })

    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selectedRange.value.start
  }

  public deleteCols(col: number, count: number) {
    if (col === 0 && count >= this.cols.value.length) {
      throw new Error('Cannot delete all columns')
    }

    this.cells.forEach((row) => {
      row.splice(col, count)
    }, [])

    this.cols.value = this.cols.value.filter((_, index) => index < col || index >= col + count)

    this.cols.value.forEach((col, index) => {
      col.index.value = index
      this.cells[index].forEach((cell, col) => {
        cell.cellReference = CellReference.fromCoords(this, { row: index, col })
      })
    })

    this.project.transformAllReferences({
      type: 'colDelete',
      grid: this,
      col,
      count,
    })

    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selectedRange.value.start
  }

  public insertRowsBefore(row: number, count: number) {
    const range = RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { row, col: 0 }),
      CellReference.fromCoords(this, { row: row + count - 1, col: this.cols.value.length - 1 }),
    )
    this.project.clipboard.copyStyleSelection(range)
    this.insertRows(row, count)
    this.project.clipboard.pasteStyleSelection(range)
  }

  public insertRowsAfter(row: number, count: number) {
    const range = RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { row, col: 0 }),
      CellReference.fromCoords(this, { row: row + count - 1, col: this.cols.value.length - 1 }),
    )
    this.project.clipboard.copyStyleSelection(range)

    this.insertRows(row + count, count)
    const movement: Movement = {
      toGrid: this,
      deltaRow: count,
      deltaCol: 0,
    }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.project.clipboard.pasteStyleSelection(range.move(movement))
  }

  private getCellIdsFromColIndex(col: number): CellReference[] {
    const startCellId = CellReference.fromCoords(this, { row: 0, col })
    const endCellId = CellReference.fromCoords(this, { row: this.rows.value.length - 1, col })
    return RangeReference.fromCellReferences(startCellId, endCellId).getAllCellReferences()
  }

  private insertRows(row: number, count: number) {
    const createdRows = Array.from({ length: count }, (_, index) => {
      const rowInstance = new Row(this, row + index, defaultRowHeight)
      this.cells.splice(row + index, 0, Array.from({ length: this.cols.value.length }, (_, col) =>
        new Cell(
          CellReference.fromCoords(this, { row: row + index, col }),
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
        cell.cellReference = CellReference.fromCoords(this, { row: index, col })
      })
    }

    this.project.transformAllReferences({
      type: 'rowInsertBefore',
      grid: this,
      row,
      count,
    })

    this.rows.value = newRows
  }

  public insertColsBefore(col: number, count: number) {
    const range = RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { row: 0, col }),
      CellReference.fromCoords(this, { row: this.rows.value.length - 1, col: col + count - 1 }),
    )

    this.project.clipboard.copyStyleSelection(range)
    this.insertCols(col, count)
    this.project.clipboard.pasteStyleSelection(range)
  }

  public insertColsAfter(col: number, count: number) {
    const range = RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { row: 0, col }),
      CellReference.fromCoords(this, { row: this.rows.value.length - 1, col: col + count - 1 }),
    )
    this.insertCols(col + count, count)
    const movement: Movement = {
      toGrid: this,
      deltaRow: 0,
      deltaCol: count,
    }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.project.clipboard.pasteStyleSelection(range.move(movement))
  }

  private insertCols(col: number, count: number) {
    const createdCols = Array.from({ length: count }, (_, index) => {
      return new Col(this, col + index, defaultColWidth)
    })

    const newCols = [
      ...this.cols.value.slice(0, col),
      ...createdCols,
      ...this.cols.value.slice(col),
    ]

    this.cells.forEach((cellRow, row) => {
      cellRow.splice(col, 0, ...Array.from({ length: count }, (_, index) =>
        new Cell(
          CellReference.fromCoords(this, { row, col: col + index }),
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
        cell.cellReference = CellReference.fromCoords(this, { row, col: index })
      }
    }

    this.project.transformAllReferences({
      type: 'colInsertBefore',
      grid: this,
      col,
      count,
    })

    this.cols.value = newCols
  }
}
