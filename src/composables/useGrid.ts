import { computed, customRef, ref, shallowReadonly } from "vue"
import { isLitsFunction, Lits } from "@mojir/lits"

const lits = new Lits()

export class Cell {
  public input = ref('')
  public output = computed(() => {
    const input = this.input.value
    if (input.startsWith('=')) {
      const program = input.slice(1)

      const { unresolvedIdentifiers } = lits.analyze(program)
      const values = [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, id) => {
        const cell = this.grid.getOrCreateCell(id.symbol)
        acc[id.symbol] = cell.output.value
        return acc
      }, {})

      const result = lits.run(program, { values })
      if (isLitsFunction(result) || Array.isArray(result) || typeof result === 'object' && result !== null) {
        throw new Error('Not supported')
      }

      return result
    }
    if (input === '') {
      return 0
    }
    const number = Number(input)
    if (!Number.isNaN(number)) {
      return number
    }
    return input
  })

  public displayValue = computed<string>(() => {
    const formattedValue = this.numberFormatterFn.value && typeof this.output.value === 'number' ?
      lits.apply(this.numberFormatterFn.value, [this.output.value])
      : this.input.value === '' ? '' : this.output.value

    return `${formattedValue}`
  })

  public numberFormatter = ref<string | null>(null) // Lits function to format numbers

  private numberFormatterFn = computed(() => {
    if (this.numberFormatter.value === null) {
      return null
    }
    const tokenStream = lits.tokenize(this.numberFormatter.value)
    const ast = lits.parse(tokenStream)
    const fn = lits.evaluate(ast, {})
    return isLitsFunction(fn) ? fn : null
  })
  // public justify: 'left' | 'center' | 'right' | 'auto' = 'auto'
  // public verticalAlign: 'top' | 'middle' | 'bottom' = 'middle'

  constructor(private readonly grid: Grid, private readonly id: string) {
    console.log('Cell created')
  }

}

class Grid {
  public rows: { id: string; height: number }[]
  public cols: { id: string; width: number }[]
  public cells: (Cell | null)[][]
  public rowHeaderWidth: number
  public colHeaderHeight: number

  constructor(rows: number, cols: number, private readonly trigger: () => void) {
    this.rows = Array.from({ length: rows }, (_, i) => ({
      id: `${i + 1}`,
      height: 26,
    }))
    this.cols = Array.from({ length: cols }, (_, i) => ({
      id: getColHeader(i),
      width: 100,
    }))
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    )
    this.rowHeaderWidth = 50
    this.colHeaderHeight = 25
  }

  public getOrCreateCell(id: string): Cell {
    const { row, col } = getRowAndCol(id)
    if (this.cells[row][col] !== null) {
      return this.cells[row][col]
    }
    this.cells[row][col] = new Cell(this, id)
    this.trigger()
    return this.cells[row][col]
  }

  public removeCell(id: string) {
    const { row, col } = getRowAndCol(id)
    if (this.cells[row][col] === null) {
      return
    }
    console.log('Cell removed')
    this.cells[row][col] = null
    this.trigger()
  }
}

export function useGrid(rows: number, cols: number) {
  const grid = shallowReadonly(customRef((track, trigger) => {
    const gridInstance = new Grid(rows, cols, trigger)
    return {
      get() {
        track()
        return gridInstance
      },
      set() { }
    }
  }))

  function getId(row: number, col: number) {
    return `${getColHeader(col)}${row + 1}`
  }

  return { grid, getId }
}

function getColHeader(col: number) {
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode((col % 26) + 65) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}

function getRowAndCol(id: string) {
  const match = id.match(/([A-Z]+)([0-9]+)/)
  if (!match) {
    throw new Error('Invalid cell id')
  }
  const [, col, row] = match
  return { row: Number(row) - 1, col: col.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0) }
}

