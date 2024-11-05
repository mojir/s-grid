import { isLitsFunction, Lits } from '@mojir/lits'
import { CellId } from './CellId'
import type { Grid } from './Grid'
import { CellStyle } from './CellStyle'
import type { Color } from './color'
import { CellRange } from './CellRange'

const lits = new Lits()

const { jsFunctions } = useCommandCenter()

export class Cell {
  public input = ref('')
  public alias = ref<string | null>(null)
  public formatter = ref<string | null>(null)
  public style = ref(new CellStyle())
  public backgroundColor = ref<Color | null>(null)

  public textColor = ref<Color | null>(null)

  private unresolvedIdentifiers = computed<string[]>(() => {
    const input = this.input.value

    if (input.startsWith('=')) {
      const program = input.slice(1)
      const { unresolvedIdentifiers } = lits.analyze(program, { jsFunctions })
      return Array.from(unresolvedIdentifiers).map(identifier => identifier.symbol)
    }

    return []
  })

  public referencedTargets = computed(() => {
    const alias = useAlias()
    return this.unresolvedIdentifiers.value.flatMap((identifier) => {
      if (CellId.isCellIdString(identifier)) {
        return CellId.fromId(identifier)
      }
      if (CellRange.isCellRangeString (identifier)) {
        return CellRange.fromId(identifier)
      }
      const aliasCell = alias.getAlias(identifier)
      if (aliasCell) {
        return aliasCell.cellId
      }
      return []
    })
  })

  public output = computed(() => {
    const input = this.input.value

    if (input === '') {
      return 0
    }

    if (input.startsWith('=')) {
      const program = input.slice(1)

      try {
        const values = this.grid.getValuesFromUndefinedIdentifiers(this.unresolvedIdentifiers.value)
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

  private formatterFn = computed(() => {
    if (this.formatter.value === null) {
      return null
    }
    const tokenStream = lits.tokenize(this.formatter.value)
    const ast = lits.parse(tokenStream)
    const fn = lits.evaluate(ast, {})
    return isLitsFunction(fn) ? fn : null
  })

  public isNumber = computed(() => {
    return typeof this.output.value === 'number'
  })

  public getJson() {
    return {
      'id': this.cellId.id,
      'input': this.input.value,
      'output': formatOutputValue(this.output.value),
      'display-value': this.displayValue.value,
      'alias': this.alias.value,
      'formatter-program': this.formatter.value,
      'row-index': this.cellId.rowIndex,
      'col-index': this.cellId.colIndex,
      'style': this.style.value.getJson(),
    }
  }

  constructor(private readonly grid: Grid, public cellId: CellId) {
    watch(this.displayValue, (newValue, oldValue) => {
      if (!oldValue && newValue) {
        this.grid.autoSetRowHeight(this.cellId)
      }
    })
  }
}

function formatOutputValue(value: unknown): unknown {
  if (value instanceof Error) {
    return 'ERR'
  }
  if (isLitsFunction(value)) {
    return 'λ'
  }

  if (typeof value === 'object' && value !== null) {
    if ((value as Record<string, unknown>)['^^fn^^']) {
      return 'λ'
    }
  }

  return value
}
