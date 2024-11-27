import { CellLocator } from '../locator/CellLocator'

export class CellEditor {
  public readonly editingCellId: Ref<CellLocator>
  public readonly editorText = ref<string>('')
  public readonly editorFocused = ref(false)

  constructor(gridName: string) {
    this.editingCellId = ref<CellLocator>(CellLocator.fromString(gridName, 'A1'))
  }

  public setEditorFocused(value: boolean) {
    this.editorFocused.value = value
  }

  public setEditingCellId(cellLocator: CellLocator) {
    this.editingCellId.value = cellLocator
  }

  public isEditingLitsCode = computed<boolean>(() => {
    return this.editorFocused.value && this.editorText.value.startsWith('=')
  })
}
