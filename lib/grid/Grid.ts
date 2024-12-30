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
  public readonly name: Ref<string>
  public readonly selection: GridSelection
  public rows: Ref<Row[]>
  public cols: Ref<Col[]>
  private readonly cells: Cell[][]
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
    this.position = shallowRef(CellReference.fromCoords(this, { rowIndex: 0, colIndex: 0 }))
    this.editor = new CellEditor(this)

    this.cells = Array.from({ length: this.rows.value.length }, (_, rowIndex) =>
      Array.from({ length: this.cols.value.length }, (_, colIndex) =>
        new Cell(CellReference.fromCoords(this, { rowIndex, colIndex }),
          {
            project: this.project,
            grid: this,
          },
        ),
      ),
    )
    this.gridRange = computed(() => RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { rowIndex: 0, colIndex: 0 }),
      CellReference.fromCoords(this, { rowIndex: this.rows.value.length - 1, colIndex: this.cols.value.length - 1 }),
    ))
    this.currentCell = computed(() => this.position.value.getCell())
  }

  static fromDTO(project: Project, grid: GridDTO): Grid {
    const gridName = getGridName(grid.name)
    const newGrid = new Grid(project, gridName, grid.rows, grid.cols)

    Object.entries(grid.cells).forEach(([key, cellDTO]) => {
      // TODO use new regexp, to avoid the need of Reference
      const cell = CellReference.fromString(newGrid, key).getCell()

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
    return newGrid
  }

  public getCell({ rowIndex, colIndex }: { rowIndex: number, colIndex: number }): Cell {
    const cell = this.cells[rowIndex]?.[colIndex]

    if (!cell) {
      throw new Error(`Cell not found: rowIndex=${rowIndex}, colIndex=${colIndex}`)
    }

    return cell
  }

  public getAllCells(): Cell[] {
    return this.cells.flat()
  }

  public getRow(rowIndex: number): Row {
    const row = this.rows.value[rowIndex]
    if (!row) {
      throw new Error(`Row not found: index=${rowIndex}`)
    }
    return row
  }

  public getCol(colIndex: number): Col {
    const col = this.cols.value[colIndex]
    if (!col) {
      throw new Error(`Col not found: index=${colIndex}`)
    }
    return col
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
    (reference ?? this.selection.selectedRange.value).getCells()
      .forEach((cell) => {
        cell.clear()
      })
  }

  public clearInput(reference: Reference | null) {
    (reference ?? this.selection.selectedRange.value).getCells()
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
    const range = wrap && selection.size() > 1 ? selection : this.gridRange.value
    this.movePositionTo(this.position.value.moveInDirection(dir, range, wrap))
  }

  public setInput(input: string, reference: Reference | null) {
    (reference ?? this.selection.selectedRange.value).getCells()
      .forEach((cell) => {
        cell.input.value = input
      })
  }

  public setBackgroundColor(color: Color | null, reference: Reference | null): void {
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.backgroundColor.value = color
    })
  }

  public getBackgroundColor(reference: Reference | null): Color | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
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
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.textColor.value = color
    })
  }

  public getTextColor(reference: Reference | null): Color | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
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
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.fontSize.value = fontSize
    })
  }

  public getFontSize(reference: Reference | null): StyleFontSize | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
    const fontSize = cells[0]?.fontSize.value
    if (fontSize === undefined) {
      return null
    }

    return cells.slice(1).every(cell => cell.fontSize.value === fontSize) ? fontSize : null
  }

  public setBold(bold: boolean, reference: Reference | null): void {
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.bold.value = bold
    })
  }

  public getBold(reference: Reference | null): boolean | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
    const bold = cells[0]?.bold.value
    if (bold === undefined) {
      return null
    }

    return cells.slice(1).every(cell => cell.bold.value === bold) ? bold : null
  }

  public setItalic(italic: boolean, reference: Reference | null): void {
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.italic.value = italic
    })
  }

  public getItalic(reference: Reference | null): boolean | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
    const italic = cells[0]?.italic.value

    if (italic === undefined) {
      return null
    }

    return cells.slice(1).every(cell => cell.italic.value === italic) ? italic : null
  }

  public setTextDecoration(textDecoration: StyleTextDecoration, reference: Reference | null): void {
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.textDecoration.value = textDecoration
    })
  }

  public getTextDecoration(reference: Reference | null): StyleTextDecoration | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
    const textDecoration = cells[0]?.textDecoration.value

    if (textDecoration === undefined) {
      return null
    }

    return cells.slice(1).every(cell => cell.textDecoration.value === textDecoration) ? textDecoration : null
  }

  public setAlign(align: StyleAlign, reference: Reference | null): void {
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.align.value = align
    })
  }

  public getAlign(reference: Reference | null): StyleAlign | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
    const align = cells[0]?.align.value

    if (align === undefined) {
      return null
    }

    return cells.slice(1).every(cell => cell.align.value === align) ? align : null
  }

  public setJustify(justify: StyleJustify, reference: Reference | null): void {
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.justify.value = justify
    })
  }

  public getJustify(reference: Reference | null): StyleJustify | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
    const justify = cells[0]?.justify.value

    if (justify === undefined) {
      return null
    }

    return cells.slice(1).every(cell => cell.justify.value === justify) ? justify : null
  }

  public setFormatter(formatter: string, reference: Reference | null): void {
    (reference ?? this.selection.selectedRange.value).getCells().forEach((cell) => {
      cell.formatter.value = formatter
    })
  }

  public getFormatter(reference: Reference | null): string | null {
    const cells = (reference ?? this.selection.selectedRange.value).getCells()
    const formatter = cells[0]?.formatter.value ?? null

    return cells.slice(1).every(cell => cell.formatter.value === formatter) ? formatter : null
  }

  public setRowHeight(height: number, rowIndex: RangeReference | null): void {
    const reference = rowIndex ?? this.selection.selectedRange.value
    reference.getAllRows().forEach(row => row.setHeight(height))
  }

  public setColWidth(width: number, rangeReference: RangeReference | null): void {
    (rangeReference ?? this.selection.selectedRange.value).getAllCols().forEach(col => col.setWidth(width))
  }

  public getSelectedRowsWithRowIndex(rowIndex: number): number[] {
    const { start, end, grid } = this.selection.selectedRange.value

    if (
      grid === this
      && start.colIndex === 0
      && end.colIndex === this.cols.value.length - 1
      && rowIndex >= start.rowIndex
      && rowIndex <= end.rowIndex) {
      return this.rows.value.slice(start.rowIndex, end.rowIndex + 1).map(row => row.index.value)
    }

    return []
  }

  public getSelectedColsWithColIndex(col: number): number[] {
    const { start, end, grid } = this.selection.selectedRange.value
    if (
      grid === this
      && start.rowIndex === 0
      && end.rowIndex === this.rows.value.length - 1
      && col >= start.colIndex && col <= end.colIndex) {
      return this.cols.value.slice(start.colIndex, end.colIndex + 1).map(col => col.index.value)
    }

    return []
  }

  public autoSetRowHeight(options: OneOf<{ rowIndices: number[], cellReference: CellReference, selection: true }>): void {
    const rowsIndices = options.rowIndices
      ? options.rowIndices
      : options.cellReference
        ? [options.cellReference.rowIndex]
        : this.selection.selectedRange.value.getAllRowIndices()

    rowsIndices.forEach((rowIndex) => {
      const cells = this.getRow(rowIndex)?.toRangeReference().getCells()

      if (!cells) {
        throw new Error(`Row not found: index=${rowIndex}`)
      }

      const maxLineHeight = cells.reduce((acc, cell) => {
        if (!cell.display.value) {
          return acc
        }
        const nbrOfLines = cell.display.value.split('\n').length
        const lineHeight = getLineHeight(cell.fontSize.value) * nbrOfLines
        return lineHeight > acc ? lineHeight : acc
      }, 0)

      this.getRow(rowIndex).setHeight(Math.max(maxLineHeight, defaultRowHeight))
    })
  }

  public autoSetColWidth(colIndices: number[]) {
    colIndices.forEach((colIndex) => {
      const cells = this.getCellIdsFromColIndex(colIndex)
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

      this.getCol(colIndex).setWidth(newColWidth)
    })
  }

  public resetSelection() {
    this.selection.select(this.position.value.toRangeReference())
  }

  public deleteRows(rowIndexToDelete: number, count: number) {
    if (count === this.rows.value.length) {
      throw new Error('Cannot delete all rows')
    }

    this.cells.splice(rowIndexToDelete, count)

    this.rows.value = this.rows.value.filter((_, index) => index < rowIndexToDelete || index >= rowIndexToDelete + count)

    const cols = this.cols.value
    const rows = this.rows.value

    for (let rowIndex = rowIndexToDelete; rowIndex < rows.length; rowIndex += 1) {
      this.getRow(rowIndex).setIndex(rowIndex)
      for (let colIndex = 0; colIndex < cols.length; colIndex += 1) {
        this.getCell({ rowIndex, colIndex }).cellReference = CellReference.fromCoords(this, { rowIndex, colIndex })
      }
    }

    this.project.transformAllReferences({
      type: 'rowDelete',
      grid: this,
      rowIndex: rowIndexToDelete,
      count,
    })

    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selectedRange.value.start
  }

  public deleteCols(colIndexToDelete: number, count: number) {
    if (colIndexToDelete === 0 && count >= this.cols.value.length) {
      throw new Error('Cannot delete all columns')
    }

    this.cells.forEach((row) => {
      row.splice(colIndexToDelete, count)
    }, [])

    this.cols.value = this.cols.value.filter((_, index) => index < colIndexToDelete || index >= colIndexToDelete + count)

    const cols = this.cols.value
    const rows = this.rows.value

    for (let colIndex = colIndexToDelete; colIndex < cols.length; colIndex += 1) {
      this.getCol(colIndex).setIndex(colIndex)
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        this.getCell({ rowIndex, colIndex }).cellReference = CellReference.fromCoords(this, { rowIndex, colIndex })
      }
    }

    this.project.transformAllReferences({
      type: 'colDelete',
      grid: this,
      colIndex: colIndexToDelete,
      count,
    })

    this.selection.clampSelection(this.gridRange.value)
    this.position.value = this.selection.selectedRange.value.start
  }

  public insertRowsBefore(rowIndex: number, count: number) {
    const range = RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { rowIndex: rowIndex, colIndex: 0 }),
      CellReference.fromCoords(this, { rowIndex: rowIndex + count - 1, colIndex: this.cols.value.length - 1 }),
    )
    this.project.clipboard.copyStyleSelection(range)
    this.insertRows(rowIndex, count)
    this.project.clipboard.pasteStyleSelection(range)
  }

  public insertRowsAfter(rowIndex: number, count: number) {
    const range = RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { rowIndex: rowIndex, colIndex: 0 }),
      CellReference.fromCoords(this, { rowIndex: rowIndex + count - 1, colIndex: this.cols.value.length - 1 }),
    )
    this.project.clipboard.copyStyleSelection(range)

    this.insertRows(rowIndex + count, count)
    const movement: Movement = {
      toGrid: this,
      deltaRow: count,
      deltaCol: 0,
    }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.project.clipboard.pasteStyleSelection(range.move(movement))
  }

  private getCellIdsFromColIndex(colIndex: number): CellReference[] {
    const startCellId = CellReference.fromCoords(this, { rowIndex: 0, colIndex })
    const endCellId = CellReference.fromCoords(this, { rowIndex: this.rows.value.length - 1, colIndex })
    return RangeReference.fromCellReferences(startCellId, endCellId).getAllCellReferences()
  }

  private insertRows(rowInsertIndex: number, count: number) {
    const createdRows = Array.from({ length: count }, (_, index) => {
      const rowInstance = new Row(this, rowInsertIndex + index, defaultRowHeight)
      this.cells.splice(rowInsertIndex + index, 0, Array.from({ length: this.cols.value.length }, (_, colIndex) =>
        new Cell(
          CellReference.fromCoords(this, { rowIndex: rowInsertIndex + index, colIndex }),
          {
            project: this.project,
            grid: this,
          },
        ),
      ))
      return rowInstance
    })

    this.rows.value = [
      ...this.rows.value.slice(0, rowInsertIndex),
      ...createdRows,
      ...this.rows.value.slice(rowInsertIndex),
    ]

    const cols = this.cols.value
    const rows = this.rows.value

    for (let rowIndex = rowInsertIndex + count; rowIndex < rows.length; rowIndex += 1) {
      this.getRow(rowIndex).setIndex(rowIndex)
      for (let colIndex = 0; colIndex < cols.length; colIndex += 1) {
        this.getCell({ rowIndex, colIndex }).cellReference = CellReference.fromCoords(this, { rowIndex, colIndex })
      }
    }

    this.project.transformAllReferences({
      type: 'rowInsertBefore',
      grid: this,
      rowIndex: rowInsertIndex,
      count,
    })
  }

  public insertColsBefore(colIndex: number, count: number) {
    const range = RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { rowIndex: 0, colIndex }),
      CellReference.fromCoords(this, { rowIndex: this.rows.value.length - 1, colIndex: colIndex + count - 1 }),
    )

    this.project.clipboard.copyStyleSelection(range)
    this.insertCols(colIndex, count)
    this.project.clipboard.pasteStyleSelection(range)
  }

  public insertColsAfter(colIndex: number, count: number) {
    const range = RangeReference.fromCellReferences(
      CellReference.fromCoords(this, { rowIndex: 0, colIndex }),
      CellReference.fromCoords(this, { rowIndex: this.rows.value.length - 1, colIndex: colIndex + count - 1 }),
    )
    this.insertCols(colIndex + count, count)
    const movement: Movement = {
      toGrid: this,
      deltaRow: 0,
      deltaCol: count,
    }
    this.selection.moveSelection(movement)
    this.position.value = this.selection.selectedRange.value.start
    this.project.clipboard.pasteStyleSelection(range.move(movement))
  }

  private insertCols(colInsertIndex: number, count: number) {
    const createdCols = Array.from({ length: count }, (_, index) => {
      return new Col(this, colInsertIndex + index, defaultColWidth)
    })

    this.cols.value = [
      ...this.cols.value.slice(0, colInsertIndex),
      ...createdCols,
      ...this.cols.value.slice(colInsertIndex),
    ]

    this.cells.forEach((cellRow, rowIndex) => {
      cellRow.splice(colInsertIndex, 0, ...Array.from({ length: count }, (_, index) =>
        new Cell(
          CellReference.fromCoords(this, { rowIndex, colIndex: colInsertIndex + index }),
          {
            project: this.project,
            grid: this,
          },
        ),
      ))
    })

    const cols = this.cols.value
    const rows = this.rows.value

    for (let colIndex = colInsertIndex + count; colIndex < cols.length; colIndex += 1) {
      this.getCol(colIndex).setIndex(colIndex)
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        this.getCell({ rowIndex, colIndex }).cellReference = CellReference.fromCoords(
          this,
          { rowIndex: rowIndex, colIndex },
        )
      }
    }

    this.project.transformAllReferences({
      type: 'colInsertBefore',
      grid: this,
      colIndex: colInsertIndex,
      count,
    })
  }
}
