import { computed, customRef, ref, shallowReadonly } from "vue"
import { createSharedComposable } from '@vueuse/core'
import { isLitsFunction, Lits } from "@mojir/lits"
import { getCommandCenter } from "@/commandCenter"

const lits = new Lits()

const defaultNbrOfRows = 100
const defaultNbrOfCols = 26
const activeCellId = ref<string>('A1')

export class Cell {
  public input = ref('')
  public output = computed(() => {
    const input = this.input.value

    if (input === '') {
      return 0
    }

    if (input.startsWith('=')) {
      const program = input.slice(1)

      const jsFunctions = getCommandCenter().jsFunctions
      const { unresolvedIdentifiers } = lits.analyze(program, { jsFunctions })
      const values = [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, id) => {
        const cell = this.grid.getOrCreateCell(id.symbol)
        acc[id.symbol] = cell.output.value
        return acc
      }, {})
      const result = lits.run(program, { values, jsFunctions })

      return result
    }


    const number = parseFloat(input)
    if (!Number.isNaN(number)) {
      return number
    }

    return input
  })

  public displayValue = computed<string>(() => {
    if (this.input.value === '') {
      return ''
    }

    if (isLitsFunction(this.output.value)) {
      return 'λ'
    }

    const formattedValue = this.formatterFn.value
      ? lits.apply(this.formatterFn.value, [this.output.value])
      : this.output.value

    return `${formattedValue}`
  })

  public formatter = ref<string | null>(null)

  private formatterFn = computed(() => {
    if (this.formatter.value === null) {
      return null
    }
    const tokenStream = lits.tokenize(this.formatter.value)
    const ast = lits.parse(tokenStream)
    const fn = lits.evaluate(ast, {})
    return isLitsFunction(fn) ? fn : null
  })

  constructor(private readonly grid: Grid, private readonly id: string) {
    console.log('Cell created')
  }

}

class Grid {
  public readonly rows: { id: string; height: number }[]
  public readonly cols: { id: string; width: number }[]
  public readonly cells: (Cell | null)[][]
  public readonly rowHeaderWidth = 50
  public readonly colHeaderHeight = 25


  constructor(rows: number, cols: number, private readonly trigger: () => void) {
    this.rows = Array.from({ length: rows }, (_, i) => ({
      id: `${i + 1}`,
      height: 26,
    }))
    this.cols = Array.from({ length: cols }, (_, i) => ({
      id: getColFromIndex(i),
      width: 100,
    }))
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    )
    this.registerCommands()
  }

  private registerCommands() {
    const commandCenter = getCommandCenter()
    commandCenter.registerCommand({
      name: 'SetCellInput!',
      execute: (id: string, input: string) => {
        const cell = this.getOrCreateCell(id)
        cell.input.value = input
      },
      description: 'Set the input of a cell',
    })
    commandCenter.registerCommand({
      name: 'ClearCell!',
      execute: (id: string) => {
        this.clearCell(id)
      },
      description: 'Set the input of a cell',
    })
    commandCenter.registerCommand({
      name: 'ClearAllCells!',
      execute: () => {
        this.clearAllCells()
      },
      description: 'Clear all cells',
    })
    commandCenter.registerCommand({
      name: 'ClearActiveCell!',
      execute: () => {
        this.clearActiveCell()
      },
      description: 'Clear the active cell',
    })
    commandCenter.registerCommand({
      name: 'GetActiveCellId',
      execute: () => {
        return activeCellId.value
      },
      description: 'Set the input of a cell',
    })
    commandCenter.registerCommand({
      name: 'GetCellInput',
      execute: (id: string) => {
        const cell = this.getCell(id)
        return cell?.input.value
      },
      description: 'Get the input of a cell',
    })
    commandCenter.registerCommand({
      name: 'GetCellOutput',
      execute: (id: string) => {
        const cell = this.getCell(id)
        return cell?.output.value
      },
      description: 'Get the output of a cell',
    })
    commandCenter.registerCommand({
      name: 'GetCellDisplayValue',
      execute: (id: string) => {
        const cell = this.getCell(id)
        return cell?.displayValue.value
      },
      description: 'Get the formatted output of a cell',
    })
    commandCenter.registerCommand({
      name: 'GetActiveCellInput',
      execute: () => {
        return this.getActiveCell()?.input.value
      },
      description: 'Get the input of a cell',
    })
    commandCenter.registerCommand({
      name: 'GetActiveCellOutput',
      execute: () => {
        return this.getActiveCell()?.output.value
      },
      description: 'Get the output of a cell',
    })
    commandCenter.registerCommand({
      name: 'GetActiveCellDisplayValue',
      execute: () => {
        return this.getActiveCell()?.displayValue.value
      },
      description: 'Get the formatted output of a cell',
    })
  }

  public getOrCreateActiveCell(): Cell {
    return this.getOrCreateCell(activeCellId.value)
  }

  public getOrCreateCell(id: string): Cell {
    const [row, col] = fromIdToCoords(id)
    if (this.cells[row][col] !== null) {
      return this.cells[row][col]
    }
    this.cells[row][col] = new Cell(this, id)
    this.trigger()
    return this.cells[row][col]
  }

  public getActiveCell(): Cell | undefined {
    return this.getCell(activeCellId.value)
  }

  public getCell(id: string): Cell | undefined {
    const [row, col] = fromIdToCoords(id)
    return this.cells[row][col] ?? undefined
  }

  public clearActiveCell() {
    this.clearCell(activeCellId.value)
  }

  public clearCell(id: string) {
    const cell = this.getCell(id)
    if (cell) {
      const [row, col] = fromIdToCoords(id)
      this.cells[row][col] = null
      this.trigger()
    }
  }

  public clearAllCells() {
    const rows = this.cells.length
    const cols = this.cells[0].length
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.cells[row][col] = null
      }
    }
    this.trigger()
  }

  public clampId(id: string): string {
    const [row, col] = fromIdToCoords(id)
    const clampedRow = Math.max(0, Math.min(row, this.rows.length - 1))
    const clampedCol = Math.max(0, Math.min(col, this.cols.length - 1))
    return fromCoordsToId(clampedRow, clampedCol)
  }
}

export const useGrid = createSharedComposable(() => {
  const grid = shallowReadonly(customRef((track, trigger) => {
    const gridInstance = new Grid(defaultNbrOfRows, defaultNbrOfCols, trigger)
    return {
      get() {
        track()
        return gridInstance
      },
      set() { }
    }
  }))

  function move(dir: 'up' | 'down' | 'left' | 'right', steps = 1) {
    const [row, col] = fromIdToCoords(activeCellId.value)
    switch (dir) {
      case 'up':
        activeCellId.value = fromCoordsToId(Math.max(0, row - steps), col)
        break
      case 'down':
        activeCellId.value = fromCoordsToId(Math.min(row + steps, grid.value.rows.length - 1), col)
        break
      case 'left':
        activeCellId.value = fromCoordsToId(row, Math.max(0, col - steps))
        break
      case 'right':
        activeCellId.value = fromCoordsToId(row, Math.min(col + steps, grid.value.cols.length - 1))
        break
    }
  }

  getCommandCenter().registerCommand({
    name: 'MoveActiveCell!',
    execute: (dir: 'up' | 'down' | 'left' | 'right', steps = 1) => {
      move(dir, steps)
    },
    description: 'Move the active cell in a direction by a number of steps, default steps is 1',
  })
  getCommandCenter().registerCommand({
    name: 'MoveActiveCellTo!',
    execute: (id: string) => {
      activeCellId.value = grid.value.clampId(id)
    },
    description: 'Move the active cell to a specific cell',
  })
  getCommandCenter().registerCommand({
    name: 'MoveActiveCellToRow!',
    execute: (row: string | number) => {
      const [, currentColIndex] = fromIdToCoords(activeCellId.value)
      const rowIndex = (typeof row === 'string' ? Number(row) : row) - 1
      activeCellId.value = grid.value.clampId(fromCoordsToId(rowIndex, currentColIndex))
    },
    description: 'Move the active cell to a specific row',
  })
  getCommandCenter().registerCommand({
    name: 'MoveActiveCellToCol!',
    execute: (row: string) => {
      const [currentRowIndex] = fromIdToCoords(activeCellId.value)
      const colIndex = getColIndex(row)
      activeCellId.value = grid.value.clampId(fromCoordsToId(currentRowIndex, colIndex))
    },
    description: 'Move the active cell to a specific column',
  })
  getCommandCenter().registerCommand({
    name: 'MoveActiveCellBy!',
    execute: (rowSteps: number, colSteps) => {
      const [row, col] = fromIdToCoords(activeCellId.value)
      activeCellId.value = grid.value.clampId(fromCoordsToId(row + rowSteps, col + colSteps))
    },
    description: 'Move the active cell by a number of steps in row and column',
  })
  getCommandCenter().registerCommand({
    name: 'MoveActiveCellToLastRow!',
    execute: () => {
      const [, currentColIndex] = fromIdToCoords(activeCellId.value)
      activeCellId.value = fromCoordsToId(grid.value.rows.length - 1, currentColIndex)
    },
    description: 'Move the active cell to the last row',
  })
  getCommandCenter().registerCommand({
    name: 'MoveActiveCellToLastCol!',
    execute: () => {
      const [currentRowIndex] = fromIdToCoords(activeCellId.value)
      activeCellId.value = fromCoordsToId(currentRowIndex, grid.value.cols.length - 1)
    },
    description: 'Move the active cell to the last column',
  })


  return { grid, fromCoordsToId, fromIdToCoords, activeCellId, move }
})

function getColFromIndex(col: number) {
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode((col % 26) + 65) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}
function getColIndex(col: string) {
  return col.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0)
}

function fromCoordsToId(row: number, col: number) {
  row = Math.max(0, row)
  col = Math.max(0, col)
  return `${getColFromIndex(col)}${row + 1}`
}
function fromIdToCoords(id: string): [number, number] {
  const match = id.match(/([A-Z]+)([0-9]+)/)
  if (!match) {
    throw new Error('Invalid cell id')
  }
  const [, col, row] = match
  return [Number(row) - 1, getColIndex(col)]
}

