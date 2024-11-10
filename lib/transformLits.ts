import { TokenType, type Token } from '@mojir/lits'
import { getCellIdStrinInfo, type Movement } from './CellId'
import { Col } from './Col'
import { Row } from './Row'

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
  console.log(tokenStream.tokens, movement)
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
      console.log('token.v', token.v)
      const info = getCellIdStrinInfo(token.v)
      if (info) {
        const newColId = info.absoluteCol ? info.colPart : Col.getColIdFromIndex(info.colIndex + movement.colDelta)
        const newRowId = info.absoluteRow ? info.rowPart : Row.getRowIdFromIndex(info.rowIndex + movement.rowDelta)
        return `${newColId}${newRowId}`
      }

      // TODO handle ranges

      return token.v
    }
    default:
      return token.v
  }
}
