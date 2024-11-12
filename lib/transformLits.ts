import { TokenType, type Token } from '@mojir/lits'
import { CellId, getInfoFromCellIdString, type Movement } from './CellId'
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

export type LitsTransformation = {
  type: 'move'
  movement: Movement
}

export function transformLits(program: string, transformation: LitsTransformation): string {
  const lits = useLits().value
  const tokenStream = lits.tokenize(program)
  let lastToken: Token | undefined
  return tokenStream.tokens.reduce((acc: string, token) => {
    const joiner = !lastToken || isNoSpaceNeededAfter(lastToken) || isNoSpaceNeededBefore(token) ? '' : ' '
    lastToken = token
    return `${acc}${joiner}${untokenize(token, transformation)}`
  }, '')
}

function untokenize(token: Token, transformation: LitsTransformation): string {
  switch (token.t) {
    case TokenType.String:
      return `"${token.v}"`
    case TokenType.Name: {
      return transformString(token.v, transformation)
    }
    default:
      return token.v
  }
}

function transformString(str: string, transformation: LitsTransformation): string {
  if (CellId.isCellIdString(str)) {
    return transformCellIdString(str, transformation)
  }
  else if (CellRange.isCellRangeString(str)) {
    return str.split('-').map(cellIdString => transformString(cellIdString, transformation)).join('-')
  }
  return str
}

function transformCellIdString(cellIdString: string, transformation: LitsTransformation): string {
  switch (transformation.type) {
    case 'move':
      return applyMovementOnCellIdString(cellIdString, transformation.movement) || cellIdString
  }
}

function applyMovementOnCellIdString(cellIdString: string, movement: Movement): string | null {
  const cellIdStringInfo = getInfoFromCellIdString(cellIdString)
  if (!cellIdStringInfo) {
    return null
  }

  const newColId = cellIdStringInfo.absoluteCol ? cellIdStringInfo.colPart : Col.getColIdFromIndex(cellIdStringInfo.colIndex + movement.cols)
  const newRowId = cellIdStringInfo.absoluteRow ? cellIdStringInfo.rowPart : Row.getRowIdFromIndex(cellIdStringInfo.rowIndex + movement.rows)
  return `${newColId}${newRowId}`
}
