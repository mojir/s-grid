import { CellLocator } from '../locator/CellLocator'

export class CellEditor {
  public readonly editorText = ref<string>('')
  public readonly editingCellId = ref<CellLocator>(CellLocator.fromString('A1'))
  public readonly editorFocused = ref(false)

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
