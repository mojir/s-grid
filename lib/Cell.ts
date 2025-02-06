import { isLitsFunction } from '@mojir/lits'
import { Color } from './color'
import { isRangeReferenceString, RangeReference } from './reference/RangeReference'
import type { Grid } from './grid/Grid'
import { CellReference, isCellReferenceString } from './reference/CellReference'
import type { Project } from './project/Project'
import { defaultFontFamily, defaultFontSize, defaultFormatter } from './constants'
import type { CellChangeEvent } from './PubSub/pubSubEvents'
import type { LitsComposable } from '~/composables/use-lits'
import type { CellDTO, StyleAlign, StyleFontFamily, StyleFontSize, StyleJustify, StyleTextDecoration } from '~/dto/CellDTO'

export class Cell {
  private readonly project: Project
  private readonly lits: LitsComposable

  public readonly grid: Grid
  public readonly input = ref('')
  public readonly numberFormatter = ref<string>(defaultFormatter)
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
  }

  public setDTO(cellDTO: Partial<CellDTO>) {
    if (cellDTO.input !== undefined && cellDTO.input !== this.input.value) {
      this.input.value = cellDTO.input
    }
    if (cellDTO.numberFormatter !== undefined && cellDTO.numberFormatter !== this.numberFormatter.value) {
      this.numberFormatter.value = cellDTO.numberFormatter
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
    this.numberFormatter.value = defaultFormatter
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

  public output = computed(() => {
    const input = this.input.value

    if (input === '') {
      return null
    }

    if (input.startsWith('\'')) {
      return input.slice(1)
    }

    if (this.formula.value !== null) {
      try {
        const values = this.project.getValuesFromUndefinedIdentifiers(this.references.value, this.grid)
        return this.lits.run(this.formula.value, { values })
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
    if (isLitsFunction(this.output.value)) {
      // TODO, this is a temporary solution
      // We can have many aliases for a cell, we should handle this
      // const alias = this.project.aliases.getAliases(this.cellReference)[0]

      // return `${alias ? `${alias} ` : ''}λ`
      return 'λ'
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
    const numberFormatter = this.numberFormatter.value
    if (numberFormatter === null) {
      return this.output.value
    }

    const identifiers = Array.from(this.lits.getUnresolvedIdentifers(numberFormatter))

    identifiers.push(...this.getReferencesFromUnresolvedIdentifiers(identifiers)
      .flatMap(reference => reference.getCells())
      .flatMap(cell => cell.references.value))

    const uniqueIdentifiers = Array.from(new Set(identifiers))

    try {
      const values = this.project.getValuesFromUndefinedIdentifiers(uniqueIdentifiers, this.grid)
      const fn = this.lits.run(numberFormatter, { values })

      if (!isLitsFunction(fn)) {
        return this.output.value
      }

      const result = this.lits.apply(fn, [this.output.value], { values })
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
      hasError: this.hasError.value,
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
