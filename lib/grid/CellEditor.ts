import type { Grid } from './Grid'

export class CellEditor {
  private readonly initialText = ref<string>('')
  public readonly editorText = ref<string>('')
  public readonly editing = ref(false)
  public readonly keyboardEnabled = ref(false)

  constructor(private grid: Grid) {
    watch(this.grid.position, () => {
      this.save()
    })
  }

  private getStringFromEvent(event: KeyboardEvent | null): string {
    if (event === null) {
      return this.grid.currentCell.value.input.value
    }
    const key = event.key
    if (key.length === 1) {
      event.preventDefault()
      return key
    }
    return this.grid.currentCell.value.input.value
  }

  public edit(value: KeyboardEvent | null, keyboardOn = true) {
    if (this.grid.currentCell.value.readonly.value) {
      this.grid.project.pubSub.publish({
        type: 'Alert',
        eventName: 'error',
        data: {
          title: 'Cell is readonly',
        },
      })
      return
    }
    if (!this.editing.value) {
      this.initialText.value = this.grid.currentCell.value.input.value
      this.editorText.value = this.getStringFromEvent(value)
      this.editing.value = true
      this.keyboardEnabled.value = keyboardOn
    }
  }

  public cancel() {
    if (this.editing.value) {
      this.grid.currentCell.value.input.value = this.initialText.value
      this.editorText.value = this.initialText.value = ''
      this.editing.value = false
      this.keyboardEnabled.value = false
    }
  }

  public save() {
    if (this.editing.value) {
      this.grid.currentCell.value.input.value = this.editorText.value
      this.editorText.value = this.initialText.value = ''
      this.editing.value = false
      this.keyboardEnabled.value = false
    }
  }

  public editingLitsCode = computed<boolean>(() => {
    return this.editing.value && this.editorText.value.startsWith('=')
  })
}
