import { isLitsFunction, Lits } from '@mojir/lits'
import type { CellId } from './CellId'
import type { Grid } from './Grid'

const lits = new Lits()

const { jsFunctions } = useCommandCenter()

export class Cell {
  public input = ref('')
  public alias = ref<string | null>(null)
  public output = computed(() => {
    const input = this.input.value

    if (input === '') {
      return 0
    }

    if (input.startsWith('=')) {
      const program = input.slice(1)

      try {
        const { unresolvedIdentifiers } = lits.analyze(program, { jsFunctions })
        const values = this.grid.getValuesFromUndefinedIdentifiers(unresolvedIdentifiers)
        const result = lits.run(program, { values, jsFunctions })
        return result
      }
      catch (error) {
        return error
      }
    }

    if (!Number.isNaN(parseFloat(input)) && !Number.isNaN(Number(input))) {
      return Number(input)
    }

    return input
  })

  public displayValue = computed<string>(() => {
    if (this.input.value === '') {
      return ''
    }

    if (this.output.value instanceof Error) {
      return 'ERR'
    }
    if (isLitsFunction(this.output.value)) {
      const alias = this.alias.value
      return `${alias ? `${alias} ` : ''}λ`
    }

    const formattedValue = this.formatterFn.value
      ? lits.apply(this.formatterFn.value, [this.output.value])
      : this.output.value

    if (Array.isArray(formattedValue)) {
      return JSON.stringify(formattedValue)
    }

    if (typeof formattedValue === 'object' && formattedValue !== null) {
      return JSON.stringify(formattedValue)
    }

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

  public getJson() {
    return {
      'id': this.cellId.id,
      'input': this.input.value,
      'output': this.output.value,
      'display-value': this.displayValue.value,
      'alias': this.alias.value,
      'formatter-program': this.formatter.value,
      'row-index': this.cellId.rowIndex,
      'col-index': this.cellId.colIndex,
    }
  }

  constructor(private readonly grid: Grid, public cellId: CellId) {}
}
