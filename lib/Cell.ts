import { isLitsError, isLitsFunction } from '@mojir/lits'
import { CellId } from './CellId'
import { CellStyle, type CellStyleJson } from './CellStyle'
import { Color, type ColorJson } from './color'
import { CellRange } from './CellRange'
import { defaultFormatter } from './utils'
import type { Grid } from './Grid'
import type { LitsComposable } from '~/composables/useLits'

export type CellJson = {
  input: string
  output: unknown
  display: string
  formatter: string | null
  style: CellStyleJson
  backgroundColor?: ColorJson | null
  textColor?: ColorJson | null
}
export class Cell {
  private grid: Grid
  private lits: LitsComposable
  private commandCenter: CommandCenterComposable
  private alias: AliasComposable

  public readonly input = ref('')
  public readonly formatter = ref<string | null>(defaultFormatter)
  public readonly style = ref(new CellStyle())
  public readonly backgroundColor = ref<Color | null>(null)
  public readonly textColor = ref<Color | null>(null)

  constructor(
    public cellId: CellId,
    {
      grid,
      lits,
      commandCenter,
      alias,
    }: {
      grid: Grid
      lits: LitsComposable
      commandCenter: CommandCenterComposable
      alias: AliasComposable
    }) {
    this.grid = grid
    this.lits = lits
    this.commandCenter = commandCenter
    this.alias = alias

    watch(this.display, (newValue, oldValue) => {
      if (!oldValue && newValue) {
        grid.autoSetRowHeightByTarget(this.cellId)
      }
    })
  }

  public setJson(json: CellJson) {
    this.input.value = json.input
    this.formatter.value = json.formatter
    this.style.value = CellStyle.fromJson(json.style)
    this.backgroundColor.value = json.backgroundColor ? Color.fromJson(json.backgroundColor) : null
    this.textColor.value = json.textColor ? Color.fromJson(json.textColor) : null
  }

  public getJson(): CellJson {
    return {
      input: this.input.value,
      output: this.output.value,
      display: this.display.value,
      formatter: this.formatter.value,
      style: this.style.value.getJson(),
      backgroundColor: this.backgroundColor.value?.getJson(),
      textColor: this.textColor.value?.getJson(),
    }
  }

  public formula = computed(() => this.input.value.startsWith('=') ? this.input.value.slice(1) : null)
  public localReferenceTargets = computed(() => this.getTargetsFromUnresolvedIdentifiers(this.localReferences.value))

  public localReferences = computed<string[]>(() => {
    const input = this.input.value

    if (this.formula.value !== null) {
      const lits = this.lits.value
      const program = input.slice(1)
      const { unresolvedIdentifiers } = lits.analyze(program, { jsFunctions: this.commandCenter.jsFunctions })
      return Array.from(unresolvedIdentifiers).map(identifier => identifier.symbol)
    }

    return []
  })

  private getTargetsFromUnresolvedIdentifiers(unresolvedIdentifiers: string[]) {
    const alias = useAlias()
    return unresolvedIdentifiers.flatMap((identifier) => {
      if (CellId.isCellIdString(identifier)) {
        return CellId.fromId(identifier)
      }
      if (CellRange.isCellRangeString (identifier)) {
        return CellRange.fromId(identifier)
      }
      const aliasCell = alias.getCell(identifier)
      if (aliasCell) {
        return aliasCell.cellId
      }
      return []
    })
  }

  private references = computed<string[]>(() => {
    const allTargets = new Set<string>(this.localReferences.value)

    this.localReferenceTargets.value
      .flatMap(target => this.grid.getCells(target))
      .flatMap(cell => cell.references.value)
      .forEach(identifier => allTargets.add(identifier))

    return Array.from(allTargets)
  })

  public output = computed(() => {
    const input = this.input.value

    if (input === '') {
      return null
    }

    if (input.startsWith('\'')) {
      return input.slice(1)
    }

    if (this.formula.value !== null) {
      const lits = this.lits.value
      try {
        const values = this.grid.getValuesFromUndefinedIdentifiers(this.references.value)
        const result = lits.run(this.formula.value, { values, jsFunctions: this.commandCenter.jsFunctions })
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
      return '#ERR'
    }
    if (this.isFunction.value) {
      const alias = this.alias.getAlias(this)

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

    const lits = this.lits.value

    const identifiers = Array.from(
      lits.analyze(formatter, { jsFunctions: this.commandCenter.jsFunctions }).unresolvedIdentifiers,
    ).map(identifier => identifier.symbol)

    identifiers.push(...this.getTargetsFromUnresolvedIdentifiers(identifiers)
      .flatMap(target => this.grid.getCells(target))
      .flatMap(cell => cell.references.value))

    const uniqueIdentifiers = Array.from(new Set(identifiers))

    try {
      const values = this.grid.getValuesFromUndefinedIdentifiers(uniqueIdentifiers)
      const fn = lits.evaluate(lits.parse(lits.tokenize(formatter)), { values, jsFunctions: this.commandCenter.jsFunctions })

      if (!isLitsFunction(fn)) {
        return this.output.value
      }

      const result = lits.apply(fn, [this.output.value], { values, jsFunctions: this.commandCenter.jsFunctions })
      return result
    }
    catch (error) {
      return error
    }
  }

  public isNumber = computed(() => {
    return typeof this.output.value === 'number'
  })

  public isError = computed(() => {
    return isLitsError(this.output.value)
  })

  public isFunction = computed(() => {
    return isLitsFunction(this.output.value)
  })

  public getDebugInfo() {
    return {
      id: this.cellId.id,
      input: this.input.value,
      output: formatOutputValue(this.output.value),
      display: this.display.value,
      formatter: this.formatter.value,
      row: this.cellId.rowIndex,
      col: this.cellId.colIndex,
      style: this.style.value.getJson(),
      localReferences: [...this.localReferences.value],
      references: [...this.references.value],
    }
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
