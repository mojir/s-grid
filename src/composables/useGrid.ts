import { computed, customRef, ref, shallowReadonly } from "vue"
import { createSharedComposable } from '@vueuse/core'
import { isLitsFunction, Lits } from "@mojir/lits"

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

      const { unresolvedIdentifiers } = lits.analyze(program)
      const values = [...unresolvedIdentifiers].reduce((acc: Record<string, unknown>, id) => {
        const cell = this.grid.getOrCreateCell(id.symbol)
        acc[id.symbol] = cell.output.value
        return acc
      }, {})

      const result = lits.run(program, { values })

      return result
    }

    const number = Number(input)
    if (!Number.isNaN(number)) {
      return number
    }

    return input
  })

  public displayValue = computed<string>(() => {
    if (this.input.value === '') {
      return ''
    }

    const formattedValue = this.formatter.value
      ? lits.apply(this.formatter.value, [this.output.value])
      : this.output.value

    return `${formattedValue}`
  })

  public numberFormatter = ref<string | null>(null) // Lits function to format numbers

  private formatter = computed(() => {
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
      id: getColHeader(i),
      width: 100,
    }))
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    )
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

  public removeCell(id: string) {
    const [row, col] = fromIdToCoords(id)
    if (this.cells[row][col] === null) {
      return
    }
    console.log('Cell removed')
    this.cells[row][col] = null
    this.trigger()
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

  function fromCoordsToId(row: number, col: number) {
    return `${getColHeader(col)}${row + 1}`
  }

  return { grid, fromCoordsToId, fromIdToCoords, activeCellId }
})

function getColHeader(col: number) {
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode((col % 26) + 65) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}
function fromIdToCoords(id: string): [number, number] {
  const match = id.match(/([A-Z]+)([0-9]+)/)
  if (!match) {
    throw new Error('Invalid cell id')
  }
  const [, col, row] = match
  return [Number(row) - 1, col.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 65, 0)]
}

