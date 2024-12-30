import type { GridDTO } from './GridDTO'

export type ProjectDTO = {
  grids: GridDTO[]
  aliases: Record<string, string>
  currentGridIndex: number
}
