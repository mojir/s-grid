import { CellId } from '~/lib/CellId'
import { CellRange } from '~/lib/CellRange'
import { defaultLineHeight } from '~/lib/CellStyle'
import { Col, type ColIdString } from '~/lib/Col'
import { Row, type RowIdString } from '~/lib/Row'

const defaultNbrOfRows = 50
const defaultNbrOfCols = 26
export const defaultColWidth = 120
export const defaultRowHeight = defaultLineHeight

export const useRowsAndCols = createSharedComposable(() => {
  const rows = shallowRef<Row[]>(Array.from({ length: defaultNbrOfRows }, (_, rowIndex) => Row.create(rowIndex, defaultRowHeight)))
  const cols = shallowRef<Col[]>(Array.from({ length: defaultNbrOfCols }, (_, colIndex) => Col.create(colIndex, defaultColWidth)))

  function getRow(id: RowIdString): Row {
    const row = rows.value[Row.getRowIndexFromId(id)]

    if (!row) {
      throw new Error(`Row ${id} not found`)
    }
    return row
  }

  function getCol(id: ColIdString): Col {
    const col = cols.value[Col.getColIndexFromId(id)]

    if (!col) {
      throw new Error(`Col ${id} not found`)
    }
    return col
  }

  function getSelectedRowsWithRowId(id: RowIdString, selection: CellRange): Row[] {
    if (selection.start.colIndex === 0 && selection.end.colIndex === cols.value.length - 1) {
      const rowIndex = Row.getRowIndexFromId(id)
      if (rowIndex >= selection.start.rowIndex && rowIndex <= selection.end.rowIndex) {
        return rows.value.slice(selection.start.rowIndex, selection.end.rowIndex + 1)
      }
    }
    return []
  }

  function getSelectedColsWithColId(id: ColIdString, selection: CellRange): Col[] {
    if (selection.start.rowIndex === 0 && selection.end.rowIndex === rows.value.length - 1) {
      const colIndex = Col.getColIndexFromId(id)
      if (colIndex >= selection.start.colIndex && colIndex <= selection.end.colIndex) {
        return cols.value.slice(selection.start.colIndex, selection.end.colIndex + 1)
      }
    }
    return []
  }

  function getCellIdsFromColIndex(colIndex: number): CellId[] {
    const startCellId = CellId.fromCoords(0, colIndex)
    const endCellId = CellId.fromCoords(rows.value.length - 1, colIndex)
    return CellRange.fromCellIds(startCellId, endCellId).getAllCellIds()
  }

  return {
    rows,
    cols,
    getRow,
    getCol,
    rowHeaderWidth: 50,
    colHeaderHeight: 25,
    minColHeight: 10,
    minRowWidth: 10,
    getCellIdsFromColIndex,
    getSelectedRowsWithRowId,
    getSelectedColsWithColId,
  }
})

export type RowsAndColsComposable = ReturnType<typeof useRowsAndCols>
