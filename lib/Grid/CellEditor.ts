import { CellId } from '~/lib/CellId'

export class CellEditor {
  public readonly editorText = ref<string>('')
  public readonly editingCellId = ref<CellId>(CellId.fromId('A1'))
  public readonly editorFocused = ref(false)

  public setEditorFocused(value: boolean) {
    this.editorFocused.value = value
  }

  public setEditingCellId(cellId: CellId) {
    this.editingCellId.value = cellId
  }

  public isEditingLitsCode = computed<boolean>(() => {
    return this.editorFocused.value && this.editorText.value.startsWith('=')
  })
}
