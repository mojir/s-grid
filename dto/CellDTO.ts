import type { CellStyleDTO } from './CellStyleDTO'
import type { ColorDTO } from './ColorDTO'

export type CellDTO = {
  input?: string
  formatter?: string
  style?: CellStyleDTO
  backgroundColor?: ColorDTO
  textColor?: ColorDTO
}
