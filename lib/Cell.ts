import { isLitsFunction } from '@mojir/lits'
import { Color } from './color'
import { isRangeLocatorString, RangeLocator } from './locator/RangeLocator'
import type { Grid } from './Grid'
import type { CommandCenter } from './CommandCenter'
import { CellLocator, isCellLocatorString } from './locator/CellLocator'
import type { GridProject } from './GridProject'
import { CellStyle } from './CellStyle'
import { defaultFormatter } from './constants'
import type { LitsComposable } from '~/composables/useLits'
import type { CellDTO } from '~/dto/CellDTO'

export class Cell {
  private readonly gridProject: GridProject
  private readonly commandCenter: CommandCenter
  private readonly lits: LitsComposable

  public readonly grid: Grid
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
      if ((!oldValue && newValue) || oldValue.split('\n').length !== newValue.split('\n').length) {
        grid.autoSetRowHeightByTarget(this.cellLocator)
      }
    })
  }

  public setDTO(cellDTO: Partial<CellDTO>) {
    if (cellDTO.input !== undefined && cellDTO.input !== this.input.value) {
      this.input.value = cellDTO.input
    }
    if (cellDTO.formatter !== undefined && cellDTO.formatter !== this.formatter.value) {
      this.formatter.value = cellDTO.formatter
    }
    if (cellDTO.style !== undefined) {
      this.style.value = CellStyle.fromDTO(cellDTO.style)
    }
    if (cellDTO.backgroundColor !== undefined) {
      this.backgroundColor.value = cellDTO.backgroundColor ? Color.fromDTO(cellDTO.backgroundColor) : null
    }
    if (cellDTO.textColor !== undefined) {
      this.textColor.value = cellDTO.textColor ? Color.fromDTO(cellDTO.textColor) : null
    }
    if (cellDTO.alias !== undefined) {
      this.gridProject.aliases.setCell(cellDTO.alias, this, true)
    }
  }

  public getDTO(): CellDTO {
    return {
      input: this.input.value,
      formatter: this.formatter.value ?? undefined,
      style: this.style.value.getDTO(),
      backgroundColor: this.backgroundColor.value?.getDTO(),
      textColor: this.textColor.value?.getDTO(),
      alias: this.gridProject.aliases.getAlias(this),
    }
  }

  public clear() {
    this.input.value = ''
    this.formatter.value = defaultFormatter
    this.backgroundColor.value = null
    this.textColor.value = null
    this.style.value = new CellStyle()
  }

  public formula = computed(() => this.input.value.startsWith('=') && this.input.value.length > 1 ? this.input.value.slice(1) : null)
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

  public setFormula(formula: string) {
    this.input.value = `=${formula}`
  }

  private getLocatorsFromUnresolvedIdentifiers(unresolvedIdentifiers: string[]) {
    return unresolvedIdentifiers.flatMap((identifier) => {
      if (isCellLocatorString(identifier)) {
        return CellLocator.fromString(this.grid.name.value, identifier)
      }
      if (isRangeLocatorString(identifier)) {
        return RangeLocator.fromString(this.grid.name.value, identifier)
      }
      const aliasCell = this.gridProject.aliases.getCell(identifier)
      if (aliasCell) {
        return aliasCell.value.cellLocator
      }
      return []
    })
  }

  private references = computed<string[]>(() => {
    const allLocatorStrings = new Set<string>(this.localReferences.value)

    this.localReferenceLocators.value
      .flatMap(locator => this.gridProject.getCellsFromLocator(locator))
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
        const values = this.gridProject.getValuesFromUndefinedIdentifiers(this.references.value, this.grid)
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
      const alias = this.gridProject.aliases.getAlias(this)

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
      .flatMap(locator => this.gridProject.getCellsFromLocator(locator))
      .flatMap(cell => cell.references.value))

    const uniqueIdentifiers = Array.from(new Set(identifiers))

    try {
      const values = this.gridProject.getValuesFromUndefinedIdentifiers(uniqueIdentifiers, this.grid)
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

  public hasError = computed(() => {
    return this.output.value instanceof Error
  })

  public isFunction = computed(() => {
    return isLitsFunction(this.output.value)
  })

  public getDebugInfo() {
    return {
      grid: this.grid.name.value,
      locator: this.cellLocator.toString(this.grid.name.value),
      input: this.input.value,
      output: formatOutputValue(this.output.value),
      display: this.display.value,
      formatter: this.formatter.value,
      row: this.cellLocator.row,
      col: this.cellLocator.col,
      style: this.style.value.getDTO(),
      localReferences: [...this.localReferences.value],
      references: [...this.references.value],
      hasError: this.hasError.value,
    }
  }
}

function formatOutputValue(value: unknown): unknown {
  if (value instanceof Error) {
    return value.message
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
