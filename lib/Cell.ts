import { isLitsFunction } from '@mojir/lits'
import { Color } from './color'
import { isRangeReferenceString, RangeReference } from './reference/RangeReference'
import type { Grid } from './grid/Grid'
import { CellReference, isCellReferenceString } from './reference/CellReference'
import type { Project } from './project/Project'
import { defaultFontFamily, defaultFontSize, defaultCellType, defaultNumberFormatter, defaultDateFormatter } from './constants'
import type { CellChangeEvent } from './PubSub/pubSubEvents'
import type { LitsComposable } from '~/composables/use-lits'
import type { CellDTO, CellType, StyleAlign, StyleFontFamily, StyleFontSize, StyleJustify, StyleTextDecoration } from '~/dto/CellDTO'

export type DerivedType = 'number' | 'date' | 'string' | 'unknown'

export class Cell {
  private readonly project: Project
  private readonly lits: LitsComposable

  public readonly grid: Grid
  public readonly input = ref('')
  public readonly cellType = ref<CellType>(defaultCellType)
  public readonly numberFormatter = ref<string>(defaultNumberFormatter)
  public readonly dateFormatter = ref<string>(defaultDateFormatter)
  public readonly fontSize = ref<StyleFontSize>(defaultFontSize)
  public readonly fontFamily = ref<StyleFontFamily>(defaultFontFamily)
  public readonly bold = ref<boolean>(false)
  public readonly italic = ref<boolean>(false)
  public readonly textDecoration = ref<StyleTextDecoration>('none')
  public readonly justify = ref<StyleJustify>('auto')
  public readonly align = ref<StyleAlign>('auto')
  public readonly backgroundColor = ref<Color | null>(null)
  public readonly textColor = ref<Color | null>(null)

  constructor(
    public cellReference: CellReference,
    {
      project,
      grid,
    }: {
      project: Project
      grid: Grid
    }) {
    this.project = project
    this.grid = grid
    this.lits = useLits()

    watch(this.display, (newValue, oldValue) => {
      if ((!oldValue && newValue) || oldValue.split('\n').length !== newValue.split('\n').length) {
        grid.autoSetRowHeight({ cellReference: this.cellReference })
      }
    })

    watch(this.input, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('input', oldValue, newValue))
    })
    watch(this.fontSize, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('fontSize', oldValue, newValue))
    })
    watch(this.fontFamily, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('fontFamily', oldValue, newValue))
    })
    watch(this.bold, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('bold', oldValue, newValue))
    })
    watch(this.italic, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('italic', oldValue, newValue))
    })
    watch(this.textDecoration, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('textDecoration', oldValue, newValue))
    })
    watch(this.justify, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('justify', oldValue, newValue))
    })
    watch(this.align, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('align', oldValue, newValue))
    })
    watch(this.backgroundColor, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('backgroundColor', oldValue, newValue))
    })
    watch(this.textColor, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('textColor', oldValue, newValue))
    })
    watch(this.numberFormatter, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('numberFormatter', oldValue, newValue))
    })
    watch(this.cellType, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('cellType', oldValue, newValue))
    })
  }

  public setDTO(cellDTO: Partial<CellDTO>) {
    if (cellDTO.input !== undefined && cellDTO.input !== this.input.value) {
      this.input.value = cellDTO.input
    }
    if (cellDTO.numberFormatter !== undefined && cellDTO.numberFormatter !== this.numberFormatter.value) {
      this.numberFormatter.value = cellDTO.numberFormatter
    }
    if (cellDTO.cellType !== undefined && cellDTO.cellType !== this.cellType.value) {
      this.cellType.value = cellDTO.cellType
    }
    if (cellDTO.fontFamily !== undefined && cellDTO.fontFamily !== this.fontFamily.value) {
      this.fontFamily.value = cellDTO.fontFamily
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
      cellType: this.cellType.value ?? undefined,
      numberFormatter: this.numberFormatter.value ?? undefined,
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
    this.cellType.value = defaultCellType
    this.numberFormatter.value = defaultNumberFormatter
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
  public referenceList = computed(() => this.getReferencesFromUnresolvedIdentifiers(this.localReferences.value))

  public localReferences = computed<string[]>(() => {
    const input = this.input.value

    if (this.formula.value !== null) {
      const program = input.slice(1)
      return Array.from(this.lits.getUnresolvedIdentifers(program))
    }

    return []
  })

  public setFormula(formula: string) {
    this.input.value = `=${formula}`
  }

  private getReferencesFromUnresolvedIdentifiers(unresolvedIdentifiers: string[]) {
    return unresolvedIdentifiers.flatMap((identifier) => {
      if (isCellReferenceString(identifier)) {
        return CellReference.fromString(this.grid, identifier)
      }
      if (isRangeReferenceString(identifier)) {
        return RangeReference.fromString(this.grid, identifier)
      }
      const aliasCell = this.project.aliases.getReference(identifier)
      if (aliasCell) {
        return aliasCell.value
      }
      return []
    })
  }

  private references = computed<string[]>(() => {
    const allReferenceStrings = new Set<string>(this.localReferences.value)

    this.referenceList.value
      .flatMap(reference => reference.getCells())
      .flatMap(cell => cell.references.value)
      .forEach(identifier => allReferenceStrings.add(identifier))

    return Array.from(allReferenceStrings)
  })

  private inputNumber = computed(() => {
    // Remove whitespace
    const inputString = this.input.value.trim()

    // Check if valid number after conversion
    const num = Number(inputString)
    return !isNaN(num) && isFinite(num) ? num : undefined
  })

  private formulaResult = computed<{ result?: unknown, error?: Error }>(() => {
    if (this.formula.value === null) {
      return {}
    }

    try {
      const values = this.project.getValuesFromUndefinedIdentifiers(this.references.value, this.grid)
      const result = this.lits.run(this.formula.value, { values })
      return { result }
    }
    catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') }
    }
  })

  public output = computed(() => {
    const input = this.input.value

    if (input === '') {
      return null
    }

    if (input.startsWith('\'')) {
      return input.slice(1)
    }

    if (this.inputNumber.value !== undefined) {
      return this.inputNumber.value
    }

    const formulaResult = this.formulaResult.value
    if (formulaResult.result !== undefined) {
      return formulaResult.result
    }

    if (this.autoDate.value !== null) {
      return this.autoDate.value
    }

    return input
  })

  private formattedNumber = computed<{ result?: string, error?: Error }>(() => {
    if (this.derivedType.value === 'number') {
      const formattedNumber = this.formatNumber(this.output.value as number)
      return formattedNumber instanceof Error
        ? { error: formattedNumber }
        : { result: formattedNumber }
    }
    return {}
  })

  private formatNumber(epoch: number): string | Error {
    try {
      // const values = this.project.getValuesFromUndefinedIdentifiers(uniqueIdentifiers, this.grid)
      const fn = this.lits.run(this.numberFormatter.value)

      if (!isLitsFunction(fn)) {
        return new Error('Invalid number formatter')
      }
      const result = this.lits.apply(fn, [epoch])
      if (typeof result === 'string') {
        return result
      }
      return new Error('Invalid number formatter')
    }
    catch (error) {
      return error instanceof Error ? error : new Error('Unknown error')
    }
  }

  private formattedDate = computed<{ result?: string, error?: Error }>(() => {
    if (this.derivedType.value === 'date') {
      const epoch = this.autoDate.value ?? this.output.value as number
      const formattedDate = this.formatDate(epoch)
      return formattedDate instanceof Error
        ? { error: formattedDate }
        : { result: formattedDate }
    }
    return {}
  })

  private formatDate(epoch: number): string | Error {
    try {
      // const values = this.project.getValuesFromUndefinedIdentifiers(uniqueIdentifiers, this.grid)
      const fn = this.lits.run(this.dateFormatter.value)

      if (!isLitsFunction(fn)) {
        return new Error('Invalid date formatter')
      }
      const result = this.lits.apply(fn, [epoch])
      if (typeof result === 'string') {
        return result
      }
      return new Error('Invalid date formatter')
    }
    catch (error) {
      return error instanceof Error ? error : new Error('Unknown error')
    }
  }

  public display = computed<string>(() => {
    const errorDisplay = '#ERR'
    if (this.error.value) {
      return errorDisplay
    }

    const output = this.output.value

    if (output === null) {
      return ''
    }

    if (isLitsFunction(output)) {
      // TODO, this is a temporary solution
      // We can have many aliases for a cell, we should handle this
      // const alias = this.project.aliases.getAliases(this.cellReference)[0]

      // return `${alias ? `${alias} ` : ''}λ`
      return 'λ'
    }

    if (this.formattedNumber.value.result) {
      console.log('formattedNumber', this.formattedNumber.value.result)
      return this.formattedNumber.value.result
    }

    if (this.formattedDate.value.result) {
      return this.formattedDate.value.result
    }

    if (typeof output === 'object') {
      return JSON.stringify(output)
    }

    return `${output}`
  })

  public autoDate = computed(() => {
    try {
      const epoch = this.lits.run('(date-fns:smart-parse input)', { values: { input: this.input.value } })
      return typeof epoch === 'number' ? epoch : null
    }
    catch {
      return null
    }
  })

  public derivedType = computed<DerivedType>(() => {
    if (this.cellType.value !== 'auto') {
      return this.cellType.value
    }

    if (this.inputNumber.value !== undefined) {
      return 'number'
    }

    const formulaResult = this.formulaResult.value
    if (formulaResult.result !== undefined) {
      if (typeof formulaResult.result === 'number') {
        return 'number'
      }
      if (typeof formulaResult.result === 'string') {
        return 'string'
      }
      return 'unknown' // TODO, more types?
    }

    if (formulaResult.error) {
      return 'unknown'
    }

    if (this.autoDate.value !== null) {
      return 'date'
    }

    return 'string'
  })

  public error = computed<Error | undefined>(() => {
    if (this.output.value === null) {
      return
    }
    if (this.output.value instanceof Error) {
      return this.output.value
    }
    if (this.formulaResult.value.error) {
      return this.formulaResult.value.error
    }
    if (this.formattedNumber.value.error) {
      return this.formattedNumber.value.error
    }
    if (this.formattedDate.value.error) {
      return this.formattedDate.value.error
    }
    if (this.cellType.value === 'number' && typeof this.output.value !== 'number') {
      return new Error('Invalid number')
    }
    if (this.cellType.value === 'date' && typeof this.output.value !== 'number') {
      return new Error('Invalid date')
    }
    if (this.cellType.value === 'string' && typeof this.output.value !== 'string' && typeof this.output.value !== 'number') {
      return new Error('Invalid string')
    }
    return
  })

  public getDebugInfo() {
    return {
      ...this.getDTO(),
      grid: this.grid.name.value,
      reference: this.cellReference.toStringForGrid(this.grid),
      output: formatOutputValue(this.output.value),
      display: this.display.value,
      rowIndex: this.cellReference.rowIndex,
      colIndex: this.cellReference.colIndex,
      localReferences: [...this.localReferences.value],
      references: [...this.references.value],
      hasError: this.error.value,
    }
  }

  private createCellChange(attribute: CellChangeEvent['data']['attribute'], oldValue: unknown, newValue: unknown): CellChangeEvent {
    return {
      source: 'Cell',
      eventName: 'cellChange',
      data: {
        gridName: this.grid.name.value,
        rowIndex: this.cellReference.rowIndex,
        colIndex: this.cellReference.colIndex,
        attribute,
        oldValue,
        newValue,
      },
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
