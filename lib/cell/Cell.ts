import { isGrid, isLitsFunction } from '@mojir/lits'
import { Color } from '../color'
import { defaultCellType, defaultDateFormatter, defaultFontFamily, defaultFontSize, defaultNumberFormatter } from '../constants'
import type { Grid } from '../grid/Grid'
import type { Project } from '../project/Project'
import type { CellChangeEvent } from '../PubSub/pubSubEvents'
import type { CellReference } from '../reference/CellReference'
import type { Reference } from '../reference/utils'
import { Mx } from '../Mx'
import type { SpillValue } from '../grid/SpillHandler'
import { calculateAllLitsDeps } from './calculateAllLitsDeps'
import { calculateReferences } from './calculateReferences'
import { calculateNumberInput } from './calculateNumberInput'
import type { DerivedType, Result } from './cellTypes'
import { calculateLitsResult } from './calculateLitsResult'
import { calculateOutput } from './calculateOutput'
import { calculateFormattedNumber } from './calculateFormattedNumber'
import { calculateFormattedDate } from './calculateFormattedDate'
import { calculateDisplay } from './calculateDisplay'
import { calculateDerivedType } from './calculateDerivedType'
import { calculateError } from './calculateError'
import { calculateInternalOutput } from './calculateInternalOutput'
import type { CellDTO, CellType, StyleAlign, StyleFontFamily, StyleFontSize, StyleJustify, StyleTextDecoration } from '~/dto/CellDTO'

export class Cell {
  private readonly project: Project
  private readonly lits = useLits()
  private readonly dateUtils = useDateUtils()

  public readonly grid: Grid
  private readonly inputState = ref('')
  public readonly spillValue = shallowRef<SpillValue | null>(null)
  public readonly watchInput = ref(true)
  public readonly isoDateInput = ref<string>()
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

    watch(this.display, (newValue, oldValue) => {
      if ((!oldValue && newValue) || oldValue.split('\n').length !== newValue.split('\n').length) {
        grid.autoSetRowHeight({ cellReference: this.cellReference })
      }
    })

    watch(this.input, (newValue, oldValue) => {
      if (this.watchInput.value) {
        if (this.cellType.value === 'auto' || this.cellType.value === 'date') {
          this.isoDateInput.value = this.dateUtils.normalizeToIsoDate(newValue)
        }
        this.grid.pubSub.publish(this.createCellChange('input', oldValue, newValue))
      }
    })
    watch(this.isoDateInput, (newValue, oldValue) => {
      this.grid.pubSub.publish(this.createCellChange('isoDateInput', oldValue, newValue))
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
      if (newValue === 'auto' || newValue === 'date') {
        this.isoDateInput.value ??= this.dateUtils.normalizeToIsoDate(this.input.value)
      }
      else {
        this.isoDateInput.value = undefined
      }
      this.grid.pubSub.publish(this.createCellChange('cellType', oldValue, newValue))
    })
    watch(this.isoDateInput, (value) => {
      if (value) {
        this.dateFormatter.value = `-> $ date:format "${this.dateUtils.getPatternFromDateString(this.input.value.trim())}"`
      }
    })
    watch(this.internalOutput, (value, oldValue) => {
      const matrix = isGrid(value)
        ? Mx.from(value)
        : Array.isArray(value)
          ? Mx.fromCol(value)
          : null

      if (this.spillFormula.value && matrix) {
        this.grid.handleSpill(this, matrix)
      }
      else if (Array.isArray(oldValue)) {
        this.grid.handleSpill(this, null)
      }
    })
  }

  public setDTO(cellDTO: Partial<CellDTO>) {
    if (cellDTO.input !== undefined && cellDTO.input !== this.input.value) {
      this.watchInput.value = false
      this.input.value = cellDTO.input
      nextTick(() => {
        this.watchInput.value = true
      })
    }
    if (cellDTO.isoDateInput !== undefined && cellDTO.isoDateInput !== this.isoDateInput.value) {
      this.isoDateInput.value = cellDTO.isoDateInput
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
      isoDateInput: this.isoDateInput.value,
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
    // TODO, what if is readonly?
    this.watchInput.value = false
    this.input.value = ''
    this.isoDateInput.value = undefined
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
    nextTick(() => {
      this.watchInput.value = true
    })
  }

  public input = computed<string>({
    get: () => this.inputState.value,
    set: (value) => {
      if (!this.readonly.value) {
        this.inputState.value = value
      }
      else {
        console.error('Cell is readonly')
      }
    },
  })

  public isEmpty = computed(() => {
    if (this.input.value) {
      return false
    }
    if (this.spillValue.value) {
      return false
    }
    return true
  })

  public computedInput = computed<string>(() => this.isoDateInput.value ?? this.input.value)

  public formula = computed<string | undefined>(() => {
    if (this.computedInput.value.startsWith('=') && this.computedInput.value.length > 1) {
      return this.computedInput.value.slice(1)
    }
    if (this.computedInput.value.startsWith(':=') && this.computedInput.value.length > 2) {
      return this.computedInput.value.slice(2)
    }
    return undefined
  })

  public spillFormula = computed<boolean>(() => !!this.formula.value && this.input.value.startsWith('='))

  public readonly = computed(() => !!this.spillValue.value && this.spillValue.value.source !== this)

  public directLitsDeps = computed<string[]>(() => this.formula.value ? Array.from(this.lits.getUnresolvedIdentifers(this.formula.value)) : [])

  public references = computed<Reference[]>(() => calculateReferences({
    grid: this.grid,
    directLitsDeps: this.directLitsDeps,
  }))

  public allLitsDeps = computed<string[]>(() => calculateAllLitsDeps({
    references: this.references,
    directLitsDeps: this.directLitsDeps,
  }))

  private numberInput = computed(() => calculateNumberInput(this.computedInput))

  private litsResult = computed<Result>(() => calculateLitsResult({
    formula: this.formula,
    allLitsDeps: this.allLitsDeps,
    run: this.lits.run,
    grid: this.grid,
  }))

  public internalOutput = computed(() => calculateInternalOutput({
    input: this.computedInput,
    numberInput: this.numberInput,
    formulaResult: this.litsResult,
  }))

  public output = computed(() => calculateOutput({
    internalOutput: this.internalOutput,
    spillValue: this.spillValue,
  }))

  public isoDate = computed<Date | undefined>(() => this.isoDateInput.value
    ? new Date(this.isoDateInput.value)
    : this.dateUtils.parseIsoDate(this.output.value),
  )

  public derivedType = computed<DerivedType>(() => calculateDerivedType({
    cellType: this.cellType,
    numberInput: this.numberInput,
    isoDate: this.isoDate,
    output: this.output,
  }))

  private formattedNumber = computed<Result<string>>(() => calculateFormattedNumber({
    derivedType: this.derivedType,
    isEmpty: this.isEmpty,
    output: this.output,
    numberFormatter: this.numberFormatter,
    run: this.lits.run,
    apply: this.lits.apply,
  }))

  private formattedDate = computed<Result<string>>(() => calculateFormattedDate({
    isoDate: this.isoDate,
    dateFormatter: this.dateFormatter,
    derivedType: this.derivedType,
    run: this.lits.run,
    apply: this.lits.apply,
  }))

  public display = computed<string>(() => calculateDisplay({
    isEmpty: this.isEmpty,
    output: this.output,
    error: this.error,
    formattedNumber: this.formattedNumber,
    formattedDate: this.formattedDate,
  }))

  public error = computed<Error | undefined>(() => calculateError({
    output: this.output,
    formulaResult: this.litsResult,
    formattedNumber: this.formattedNumber,
    formattedDate: this.formattedDate,
    cellType: this.cellType,
    isoDate: this.isoDate,
  }))

  public setFormula(formula: string) {
    this.input.value = `=${formula}`
  }

  public getDebugInfo() {
    return {
      ...this.getDTO(),
      grid: this.grid.name.value,
      reference: this.cellReference.toStringForGrid(this.grid),
      output: formatDebugOutputValue(this.output.value),
      display: this.display.value,
      rowIndex: this.cellReference.rowIndex,
      colIndex: this.cellReference.colIndex,
      localReferences: [...this.directLitsDeps.value],
      references: [...this.allLitsDeps.value],
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

function formatDebugOutputValue(value: unknown): unknown {
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
