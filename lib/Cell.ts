import { isLitsFunction, Lits } from '@mojir/lits'
import { CellId } from './CellId'
import type { Grid } from './Grid'
import { CellStyle } from './CellStyle'
import type { Color } from './color'
import { CellRange } from './CellRange'
import { defaultFormatter } from './utils'

const lits = new Lits()

const { jsFunctions } = useCommandCenter()

export class Cell {
  public input = ref('')
  public alias = ref<string | null>(null)
  public formatter = ref<string | null>(defaultFormatter)
  public style = ref(new CellStyle())
  public backgroundColor = ref<Color | null>(null)
  public textColor = ref<Color | null>(null)

  public formula = computed(() => this.input.value.startsWith('=') ? this.input.value.slice(1) : null)

  private localUnresolvedIdentifiers = computed<string[]>(() => {
    const input = this.input.value

    if (this.formula.value !== null) {
      const program = input.slice(1)
      const { unresolvedIdentifiers } = lits.analyze(program, { jsFunctions })
      return Array.from(unresolvedIdentifiers).map(identifier => identifier.symbol)
    }

    return []
  })

  public localReferencedTargets = computed(() => this.getTargetsFromUnresolvedIdentifiers(this.localUnresolvedIdentifiers.value))

  private getTargetsFromUnresolvedIdentifiers(unresolvedIdentifiers: string[]) {
    const alias = useAlias()
    return unresolvedIdentifiers.flatMap((identifier) => {
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
  }

  private unresolvedIdentifiers = computed<string[]>(() => {
    const allTargets = new Set<string>(this.localUnresolvedIdentifiers.value)

    this.localReferencedTargets.value
      .flatMap(target => this.grid.getCells(target))
      .flatMap(cell => cell.unresolvedIdentifiers.value)
      .forEach(identifier => allTargets.add(identifier))

    return Array.from(allTargets)
  })

  public output = computed(() => {
    const input = this.input.value

    if (input === '') {
      return null
    }

    if (this.formula.value !== null) {
      try {
        const values = this.grid.getValuesFromUndefinedIdentifiers(this.unresolvedIdentifiers.value)
        const result = lits.run(this.formula.value, { values, jsFunctions })
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

  public display = computed<string>(() => {
    if (this.output.value === null) {
      return ''
    }

    if (this.output.value instanceof Error) {
      return 'ERR'
    }
    if (isLitsFunction(this.output.value)) {
      const alias = this.alias.value
      return `${alias ? `${alias} ` : ''}λ`
    }

    const formattedOutput = this.formatOutput()

    if (Array.isArray(formattedOutput)) {
      return JSON.stringify(formattedOutput)
    }

    if (typeof formattedOutput === 'object' && formattedOutput !== null) {
      return JSON.stringify(formattedOutput)
    }

    return `${formattedOutput}`
  })

  private formatOutput() {
    if (typeof this.output.value !== 'number') {
      return this.output.value
    }
    const formatter = this.formatter.value
    if (formatter === null) {
      return this.output.value
      // return defaultFormatter(this.output.value)
    }

    const identifiers = Array.from(
      lits.analyze(formatter, { jsFunctions }).unresolvedIdentifiers,
    ).map(identifier => identifier.symbol)

    identifiers.push(...this.getTargetsFromUnresolvedIdentifiers(identifiers)
      .flatMap(target => this.grid.getCells(target))
      .flatMap(cell => cell.unresolvedIdentifiers.value))

    const uniqueIdentifiers = Array.from(new Set(identifiers))

    try {
      const values = this.grid.getValuesFromUndefinedIdentifiers(uniqueIdentifiers)
      const fn = lits.evaluate(lits.parse(lits.tokenize(formatter)), { values, jsFunctions })

      if (!isLitsFunction(fn)) {
        return this.output.value
      }

      const result = lits.apply(fn, [this.output.value], { values, jsFunctions })
      return result
    }
    catch (error) {
      return error
    }
  }

  public isNumber = computed(() => {
    return typeof this.output.value === 'number'
  })

  public getJson() {
    return {
      id: this.cellId.id,
      input: this.input.value,
      output: formatOutputValue(this.output.value),
      display: this.display.value,
      alias: this.alias.value,
      formatter: this.formatter.value,
      row: this.cellId.rowIndex,
      col: this.cellId.colIndex,
      style: this.style.value.getJson(),
      localReferences: this.localReferencedTargets.value.map(target => target.id),
      references: [...this.unresolvedIdentifiers.value],
    }
  }

  constructor(private readonly grid: Grid, public cellId: CellId) {
    watch(this.display, (newValue, oldValue) => {
      if (!oldValue && newValue) {
        this.grid.autoSetRowHeightByTarget(this.cellId)
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
