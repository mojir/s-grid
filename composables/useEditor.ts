import { CellId } from '~/lib/CellId'

const editorText = ref<string>('')
const editingCellId = ref<CellId>(CellId.fromId('A1'))
const editorFocused = ref(false)

function setEditorFocused(value: boolean) {
  editorFocused.value = value
}

function setEditingCellId(cellId: CellId) {
  editingCellId.value = cellId
}

const isEditingLitsCode = computed<boolean>(() => {
  return editorFocused.value && editorText.value.startsWith('=')
})

export function useEditor() {
  return {
    editorText,
    editorFocused: readonly(editorFocused),
    setEditorFocused,
    isEditingLitsCode,
    editingCellId: readonly(editingCellId),
    setEditingCellId,
  }
}
