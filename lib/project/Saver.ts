import type { SGridEvent } from '../PubSub/pubSubEvents'
import type { Project } from './Project'

export class Saver {
  public constructor(private project: Project) {
    this.project.pubSub.subscribe({
      filter: { Change: true },
      callback: this.onPubSubEvent.bind(this),
    })
  }

  private timer: null | ReturnType<typeof setTimeout> = null

  private onPubSubEvent(_event: SGridEvent) {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(() => {
      this.timer = null
      this.save()
    }, 250)
  }

  public clear(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('current-project')
    }
  }

  public save(projectDTO = this.project.getDTO()): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('current-project', JSON.stringify(projectDTO))
    }
  }
}
