import { isLitsError, isLitsFunction } from '@mojir/lits'
import { CellStyle, type CellStyleJson } from './CellStyle'
import { Color, type ColorJson } from './color'
import { isRangeLocatorString, RangeLocator } from './locator/RangeLocator'
import { defaultFormatter } from './utils'
import type { Grid } from './Grid'
import type { CommandCenter } from './CommandCenter'
import { CellLocator, isCellLocatorString } from './locator/CellLocator'
import type { GridProject } from './GridProject'
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
  private gridProject: GridProject
  private grid: Grid
  private commandCenter: CommandCenter
  private lits: LitsComposable

  public readonly input = ref('')
  public readonly formatter = ref<string | null>(defaultFormatter)
  public readonly style = ref(new CellStyle())
  public readonly backgroundColor = ref<Color | null>(null)
  public readonly textColor = ref<Color | null>(null)

  constructor(
    public cellLocator: CellLocator,
    {
      gridProject,
      grid,
      commandCenter,
    }: {
      gridProject: GridProject
      grid: Grid
      commandCenter: CommandCenter
    }) {
    this.gridProject = gridProject
    this.grid = grid
    this.commandCenter = commandCenter
    this.lits = useLits()

    watch(this.display, (newValue, oldValue) => {
      if (!oldValue && newValue) {
        grid.autoSetRowHeightByTarget(this.cellLocator)
      }
    })
  }

  public setJson(json: Partial<CellJson>) {
    if (json.input !== undefined && json.input !== this.input.value) {
      this.input.value = json.input
    }
    if (json.formatter !== undefined && json.formatter !== this.formatter.value) {
      this.formatter.value = json.formatter
    }
    if (json.style !== undefined) {
      this.style.value = CellStyle.fromJson(json.style)
    }
    if (json.backgroundColor !== undefined) {
      this.backgroundColor.value = json.backgroundColor ? Color.fromJson(json.backgroundColor) : null
    }
    if (json.textColor !== undefined) {
      this.textColor.value = json.textColor ? Color.fromJson(json.textColor) : null
    }
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

  public clear() {
    this.input.value = ''
    this.formatter.value = defaultFormatter
    this.backgroundColor.value = null
    this.textColor.value = null
    this.style.value = new CellStyle()
  }

  public formula = computed(() => this.input.value.startsWith('=') ? this.input.value.slice(1) : null)
  public localReferenceLocators = computed(() => this.getLocatorsFromUnresolvedIdentifiers(this.localReferences.value))

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

  private getLocatorsFromUnresolvedIdentifiers(unresolvedIdentifiers: string[]) {
    return unresolvedIdentifiers.flatMap((identifier) => {
      if (isCellLocatorString(identifier)) {
        return CellLocator.fromString(identifier)
      }
      if (isRangeLocatorString(identifier)) {
        return RangeLocator.fromString(identifier)
      }
      const aliasCell = this.grid.alias.getCell(identifier)
      if (aliasCell) {
        return aliasCell.cellLocator
      }
      return []
    })
  }

  private references = computed<string[]>(() => {
    const allLocatorStrings = new Set<string>(this.localReferences.value)

    this.localReferenceLocators.value
      .flatMap(locator => this.grid.getCellsFromLocator(locator))
      .flatMap(cell => cell.references.value)
      .forEach(identifier => allLocatorStrings.add(identifier))

    return Array.from(allLocatorStrings)
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
        const values = this.gridProject.getValuesFromUndefinedIdentifiers(this.references.value)
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
      const alias = this.grid.alias.getAlias(this)

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

    identifiers.push(...this.getLocatorsFromUnresolvedIdentifiers(identifiers)
      .flatMap(locator => this.grid.getCellsFromLocator(locator))
      .flatMap(cell => cell.references.value))

    const uniqueIdentifiers = Array.from(new Set(identifiers))

    try {
      const values = this.gridProject.getValuesFromUndefinedIdentifiers(uniqueIdentifiers)
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
      id: this.cellLocator.toString(),
      input: this.input.value,
      output: formatOutputValue(this.output.value),
      display: this.display.value,
      formatter: this.formatter.value,
      row: this.cellLocator.row,
      col: this.cellLocator.col,
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
