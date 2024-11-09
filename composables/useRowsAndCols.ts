import { defaultLineHeight } from '~/lib/CellStyle'
import { Col } from '~/lib/Col'
import { Row } from '~/lib/Row'

const defaultNbrOfRows = 50
const defaultNbrOfCols = 26
const defaultColWidth = 120

export const useRowsAndCols = createSharedComposable(() => {
  const rows = shallowRef<Row[]>(Array.from({ length: defaultNbrOfRows }, (_, rowIndex) => Row.create(rowIndex, defaultLineHeight)))
  const cols = shallowRef<Col[]>(Array.from({ length: defaultNbrOfCols }, (_, colIndex) => Col.create(colIndex, defaultColWidth)))

  function getRow(id: string): Row {
    const row = rows.value[Row.getRowIndexFromId(id)]

    if (!row) {
      throw new Error(`Row ${id} not found`)
    }
    return row
  }

  function getCol(id: string): Col {
    const col = cols.value[Col.getColIndexFromId(id)]

    if (!col) {
      throw new Error(`Col ${id} not found`)
    }
    return col
  }

  return {
    rows,
    cols,
    getRow,
    getCol,
    rowHeaderWidth: 50,
    colHeaderHeight: 25,
  }
})
