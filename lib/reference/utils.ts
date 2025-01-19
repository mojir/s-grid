import type { Diagram } from '../Diagram'
import type { Grid } from '../grid/Grid'
import type { Project } from '../project/Project'
import { CellReference, isCellReferenceString } from './CellReference'
import { isRangeReferenceString, RangeReference } from './RangeReference'

export type Reference = CellReference | RangeReference

export type Heading = 'up' | 'down' | 'left' | 'right'
export type Direction =
  | Heading
  | 'top'
  | 'bottom'
  | 'leftmost'
  | 'rightmost'
  | 'pageUp'
  | 'pageDown'
  | 'pageRight'
  | 'pageLeft'

export type Movement = {
  toGrid?: Grid
  deltaRow?: number
  deltaCol?: number
}

export enum DocumentIdType {
  Cell = 'cell',
  Row = 'row',
  Col = 'col',
  ResizeRow = 'resize-row',
  ResizeCol = 'resize-col',
  Diagram = 'diagram',
}

export function getDiagramId(diagram: Diagram): string {
  return `${DocumentIdType.Diagram}|${diagram.name.value}`
}

export function getDocumentCellId(cellReference: CellReference): string {
  return `${DocumentIdType.Cell}|${cellReference.grid.name.value}|${cellReference.toRelative().toStringWithoutGrid()}`
}

export function getDocumentRowId(grid: Grid, rowIndex: number): string {
  return `${DocumentIdType.Row}|${grid.name.value}|${rowIndex}`
}

export function getDocumentResizeRowId(grid: Grid, rowIndex: number): string {
  return `${DocumentIdType.ResizeRow}|${grid.name.value}|${rowIndex}`
}

export function getDocumentColId(grid: Grid, colIndex: number): string {
  return `${DocumentIdType.Col}|${grid.name.value}|${colIndex}`
}

export function getDocumentResizeColId(grid: Grid, colIndex: number): string {
  return `${DocumentIdType.ResizeCol}|${grid.name.value}|${colIndex}`
}

export function getReferenceFromString(currenctGrid: Grid, referenceString: string): Reference | null {
  return isCellReferenceString(referenceString)
    ? CellReference.fromString(currenctGrid, referenceString)
    : isRangeReferenceString(referenceString)
      ? RangeReference.fromString(currenctGrid, referenceString)
      : null
}

export function getReferenceFromStringWithGrid(project: Project, referenceString: string): Reference {
  if (!isReferenceString(referenceString)) {
    throw new Error(`Invalid reference string: ${referenceString}`)
  }

  const gridName = referenceString.split('!')[0]!
  const grid = project.getGridByName(gridName)

  return isCellReferenceString(referenceString)
    ? CellReference.fromString(grid, referenceString)
    : RangeReference.fromString(grid, referenceString)
}

export function isReferenceString(referenceString: string): boolean {
  return isCellReferenceString(referenceString) || isRangeReferenceString(referenceString)
}

type Deltas = {
  deltaRow: number
  deltaCol: number
}

export function getAutoFillRangeInfo(source: Reference, toCell: CellReference): { direction: Heading, autoFillRange: RangeReference } | null {
  const sourceRange = source.toRangeReference()

  const deltas = getDeltas(sourceRange, toCell)
  const direction = getAutoFillDirection(deltas)

  if (!direction) {
    return null
  }
  const autoFillRange = getAutofillRange({ sourceRange, deltas, direction })
  if (!autoFillRange) {
    return null
  }

  return {
    direction,
    autoFillRange,
  }
}

function getAutoFillDirection({ deltaRow, deltaCol }: Deltas): Heading | null {
  if (deltaRow === 0 && deltaCol === 0) {
    return null
  }

  if (Math.abs(deltaRow) >= Math.abs(deltaCol)) {
    return deltaRow >= 0 ? 'down' : 'up'
  }
  else {
    return deltaCol >= 0 ? 'right' : 'left'
  }
}

function getDeltas(sourceRange: RangeReference, toCell: CellReference): { deltaRow: number, deltaCol: number } {
  const deltaRow = toCell.rowIndex > sourceRange.end.rowIndex
    ? toCell.rowIndex - sourceRange.end.rowIndex
    : toCell.rowIndex < sourceRange.start.rowIndex
      ? toCell.rowIndex - sourceRange.start.rowIndex
      : 0

  const deltaCol = toCell.colIndex > sourceRange.end.colIndex
    ? toCell.colIndex - sourceRange.end.colIndex
    : toCell.colIndex < sourceRange.start.colIndex
      ? toCell.colIndex - sourceRange.start.colIndex
      : 0

  return {
    deltaRow,
    deltaCol,
  }
}

function getAutofillRange({ sourceRange, deltas, direction }: { sourceRange: RangeReference, deltas: Deltas, direction: Heading }): RangeReference | null {
  switch (direction) {
    case 'down': {
      const deltaRow = getNextMultiple(sourceRange.rowCount(), deltas.deltaRow, sourceRange.grid.rows.value.length - sourceRange.end.rowIndex - 1)
      if (deltaRow === null) {
        return null
      }
      return RangeReference.fromCoords(sourceRange.grid, {
        startRowIndex: sourceRange.end.rowIndex + 1,
        startColIndex: sourceRange.start.colIndex,
        endRowIndex: sourceRange.end.rowIndex + deltaRow,
        endColIndex: sourceRange.end.colIndex,
      })
    }
    case 'right': {
      const deltaCol = getNextMultiple(sourceRange.colCount(), deltas.deltaCol, sourceRange.grid.cols.value.length - sourceRange.end.colIndex - 1)
      if (deltaCol === null) {
        return null
      }
      return RangeReference.fromCoords(sourceRange.grid, {
        startRowIndex: sourceRange.start.rowIndex,
        startColIndex: sourceRange.end.colIndex + 1,
        endRowIndex: sourceRange.end.rowIndex,
        endColIndex: sourceRange.end.colIndex + deltaCol,
      })
    }
    case 'up': {
      const deltaRow = getNextMultiple(sourceRange.rowCount(), -deltas.deltaRow, sourceRange.start.rowIndex)
      if (deltaRow === null) {
        return null
      }
      return RangeReference.fromCoords(sourceRange.grid, {
        startRowIndex: sourceRange.start.rowIndex - deltaRow,
        startColIndex: sourceRange.start.colIndex,
        endRowIndex: sourceRange.end.rowIndex - 1,
        endColIndex: sourceRange.end.colIndex,
      })
    }
    case 'left': {
      const deltaCol = getNextMultiple(sourceRange.colCount(), -deltas.deltaCol, sourceRange.start.colIndex)
      if (deltaCol === null) {
        return null
      }
      return RangeReference.fromCoords(sourceRange.grid, {
        startRowIndex: sourceRange.start.rowIndex,
        startColIndex: sourceRange.start.colIndex - deltaCol,
        endRowIndex: sourceRange.end.rowIndex,
        endColIndex: sourceRange.end.colIndex - 1,
      })
    }
  }
}

export function getNextMultiple(size: number, value: number, max: number): number | null {
  if (size <= 0) {
    throw new Error('Size must be a positive integer')
  }
  const startMultiple = Math.ceil(value / size)

  for (let i = startMultiple; i > 0; i -= 1) {
    if (i * size <= max) {
      return i * size
    }
  }
  return null
}
