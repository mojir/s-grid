import { isLitsFunction } from '@mojir/lits'
import { Color } from './color'
import { isRangeLocatorString, RangeLocator } from './locators/RangeLocator'
import type { Grid } from './grid/Grid'
import type { CommandCenter } from './CommandCenter'
import { CellLocator, isCellLocatorString } from './locators/CellLocator'
import type { Project } from './project/Project'
import { defaultFontSize, defaultFormatter } from './constants'
import type { LitsComposable } from '~/composables/use-lits'
import type { CellDTO, StyleAlign, StyleFontSize, StyleJustify, StyleTextDecoration } from '~/dto/CellDTO'

export class Cell {
  private readonly project: Project
  private readonly commandCenter: CommandCenter
  private readonly lits: LitsComposable

  public readonly grid: Grid
  public readonly input = ref('')
  public readonly formatter = ref<string>(defaultFormatter)
  public readonly fontSize = ref<StyleFontSize>(defaultFontSize)
  public readonly bold = ref<boolean>(false)
  public readonly italic = ref<boolean>(false)
  public readonly textDecoration = ref<StyleTextDecoration>('none')
  public readonly justify = ref<StyleJustify>('auto')
  public readonly align = ref<StyleAlign>('bottom')
  public readonly backgroundColor = ref<Color | null>(null)
  public readonly textColor = ref<Color | null>(null)

  constructor(
    public cellLocator: CellLocator,
    {
      project,
      grid,
      commandCenter,
    }: {
      project: Project
      grid: Grid
      commandCenter: CommandCenter
    }) {
    this.project = project
    this.grid = grid
    this.commandCenter = commandCenter
    this.lits = useLits()

    watch(this.display, (newValue, oldValue) => {
      if ((!oldValue && newValue) || oldValue.split('\n').length !== newValue.split('\n').length) {
        grid.autoSetRowHeightByTarget(this.cellLocator)
      }
    })

    watch(this.input, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'input', oldValue, newValue })
    })
    watch(this.fontSize, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'fontSize', oldValue, newValue })
    })
    watch(this.bold, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'bold', oldValue, newValue })
    })
    watch(this.italic, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'italic', oldValue, newValue })
    })
    watch(this.textDecoration, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'textDecoration', oldValue, newValue })
    })
    watch(this.justify, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'justify', oldValue, newValue })
    })
    watch(this.align, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'align', oldValue, newValue })
    })
    watch(this.backgroundColor, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'backgroundColor', oldValue, newValue })
    })
    watch(this.textColor, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'textColor', oldValue, newValue })
    })
    watch(this.formatter, (newValue, oldValue) => {
      this.project.history.registerChange({ cell: this, attribute: 'formatter', oldValue, newValue })
    })
  }

  public setDTO(cellDTO: Partial<CellDTO>) {
    if (cellDTO.input !== undefined && cellDTO.input !== this.input.value) {
      this.input.value = cellDTO.input
    }
    if (cellDTO.formatter !== undefined && cellDTO.formatter !== this.formatter.value) {
      this.formatter.value = cellDTO.formatter
    }
    if (cellDTO.fontSize !== undefined && cellDTO.fontSize !== this.fontSize.value) {
      this.fontSize.value = cellDTO.fontSize
    }
    if (cellDTO.bold !== undefined && cellDTO.bold !== this.bold.value) {
      this.bold.value = cellDTO.bold
    }
    if (cellDTO.italic !== undefined && cellDTO.italic !== this.italic.value) {
      this.italic.value = cellDTO.italic
    }
    if (cellDTO.textDecoration !== undefined && cellDTO.textDecoration !== this.textDecoration.value) {
      this.textDecoration.value = cellDTO.textDecoration
    }
    if (cellDTO.justify !== undefined && cellDTO.justify !== this.justify.value) {
      this.justify.value = cellDTO.justify
    }
    if (cellDTO.align !== undefined && cellDTO.align !== this.align.value) {
      this.align.value = cellDTO.align
    }
    if (cellDTO.backgroundColor !== undefined) {
      this.backgroundColor.value = cellDTO.backgroundColor ? Color.fromDTO(cellDTO.backgroundColor) : null
    }
    if (cellDTO.textColor !== undefined) {
      this.textColor.value = cellDTO.textColor ? Color.fromDTO(cellDTO.textColor) : null
    }
  }

  public getDTO(): CellDTO {
    return {
      input: this.input.value,
      formatter: this.formatter.value ?? undefined,
      fontSize: this.fontSize.value ?? undefined,
      bold: this.bold.value ?? undefined,
      italic: this.italic.value ?? undefined,
      textDecoration: this.textDecoration.value ?? undefined,
      justify: this.justify.value ?? undefined,
      align: this.align.value ?? undefined,
      backgroundColor: this.backgroundColor.value?.getDTO(),
      textColor: this.textColor.value?.getDTO(),
    }
  }

  public clear() {
    this.input.value = ''
    this.formatter.value = defaultFormatter
    this.fontSize.value = defaultFontSize
    this.bold.value = false
    this.italic.value = false
    this.textDecoration.value = 'none'
    this.justify.value = 'auto'
    this.align.value = 'bottom'
    this.backgroundColor.value = null
    this.textColor.value = null
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
        return CellLocator.fromString(this.grid, identifier)
      }
      if (isRangeLocatorString(identifier)) {
        return RangeLocator.fromString(this.grid, identifier)
      }
      const aliasCell = this.project.aliases.getCell(identifier)
      if (aliasCell) {
        return aliasCell.value.cellLocator
      }
      return []
    })
  }

  private references = computed<string[]>(() => {
    const allLocatorStrings = new Set<string>(this.localReferences.value)

    this.localReferenceLocators.value
      .flatMap(locator => this.project.locator.getCellsFromLocator(locator))
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
        const values = this.project.getValuesFromUndefinedIdentifiers(this.references.value, this.grid)
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
      const alias = this.project.aliases.getAlias(this)

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
    }

    const lits = this.lits.value

    const identifiers = Array.from(
      lits.analyze(formatter, { jsFunctions: this.commandCenter.jsFunctions }).unresolvedIdentifiers,
    ).map(identifier => identifier.symbol)

    identifiers.push(...this.getLocatorsFromUnresolvedIdentifiers(identifiers)
      .flatMap(locator => this.project.locator.getCellsFromLocator(locator))
      .flatMap(cell => cell.references.value))

    const uniqueIdentifiers = Array.from(new Set(identifiers))

    try {
      const values = this.project.getValuesFromUndefinedIdentifiers(uniqueIdentifiers, this.grid)
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
      ...this.getDTO(),
      grid: this.grid.name.value,
      locator: this.cellLocator.toString(this.grid),
      output: formatOutputValue(this.output.value),
      display: this.display.value,
      row: this.cellLocator.row,
      col: this.cellLocator.col,
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
