const delimiter = ','

export function parseCsv(csv: string): string[][] {
  return csv
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(parseLine)
}

function parseLine(line: string): string[] {
  let position = 0
  const result: string[] = []
  while (position < line.length) {
    let value = ''
    if (line[position] === '"') {
      position += 1
      while (position < line.length) {
        if (line[position] === '"') {
          if (line[position + 1] === '"') {
            value += '"'
            position += 2
          }
          else {
            position += 1
            break
          }
        }
        else {
          value += line[position]
          position += 1
        }
      }
    }
    else {
      const nextComma = line.indexOf(delimiter, position)
      if (nextComma < 0) {
        value = line.slice(position)
        position = line.length
      }
      else {
        value = line.slice(position, nextComma)
        position = nextComma + 1
      }
    }
    result.push(value)
  }
  return result
}
