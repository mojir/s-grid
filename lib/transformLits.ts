import { TokenType, type Token } from '@mojir/lits'
import { getInfoFromCellIdString, type Movement } from './CellId'
import { Col } from './Col'
import { Row } from './Row'
import { CellRange } from './CellRange'

function isNoSpaceNeededBefore(token: Token): boolean {
  switch (token.t) {
    case TokenType.Bracket:
      return [')', ']'].includes(token.v)
    case TokenType.CollectionAccessor:
      return true
    case TokenType.NewLine:
      return true
    default:
      return false
  }
}

function isNoSpaceNeededAfter(token: Token): boolean {
  switch (token.t) {
    case TokenType.Bracket:
      return ['(', '['].includes(token.v)
    case TokenType.CollectionAccessor:
      return true
    case TokenType.FnShorthand:
      return true
    case TokenType.NewLine:
      return true
    case TokenType.RegexpShorthand:
      return true
    default:
      return false
  }
}

export function transformLits(program: string, movement: Movement): string {
  const lits = useLits().value
  const tokenStream = lits.tokenize(program)
  let lastToken: Token | undefined
  return tokenStream.tokens.reduce((acc: string, token) => {
    const joiner = !lastToken || isNoSpaceNeededAfter(lastToken) || isNoSpaceNeededBefore(token) ? '' : ' '
    lastToken = token
    return `${acc}${joiner}${getValueFromToken(token, movement)}`
  }, '')
}

function getValueFromToken(token: Token, movement: Movement): string {
  switch (token.t) {
    case TokenType.String:
      return `"${token.v}"`
    case TokenType.Name: {
      const movedCellIdString = applyMovementOnCellIdString(token.v, movement)
      if (movedCellIdString) {
        return movedCellIdString
      }

      const movedCellRangeStringId = applyMovementOnRangeIdString(token.v, movement)
      if (movedCellRangeStringId) {
        return movedCellRangeStringId
      }

      return token.v
    }
    default:
      return token.v
  }
}

function applyMovementOnCellIdString(cellIdString: string, movement: Movement): string | null {
  const cellIdStringInfo = getInfoFromCellIdString(cellIdString)
  if (!cellIdStringInfo) {
    return null
  }

  const newColId = cellIdStringInfo.absoluteCol ? cellIdStringInfo.colPart : Col.getColIdFromIndex(cellIdStringInfo.colIndex + movement.colDelta)
  const newRowId = cellIdStringInfo.absoluteRow ? cellIdStringInfo.rowPart : Row.getRowIdFromIndex(cellIdStringInfo.rowIndex + movement.rowDelta)
  return `${newColId}${newRowId}`
}

function applyMovementOnRangeIdString(rangeIdString: string, movement: Movement): string | null {
  if (!CellRange.isCellRangeString(rangeIdString)) {
    return null
  }
  const [start, end] = rangeIdString.split('-').map(cellIdString => applyMovementOnCellIdString(cellIdString, movement))
  if (!start || !end) {
    return null
  }
  return `${start}-${end}`
}
