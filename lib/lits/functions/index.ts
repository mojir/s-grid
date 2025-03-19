import { Lits } from '@mojir/lits'

const lits = new Lits({ debug: true })

// Define types for the modules
type FunctionInfo = {
  content: string
  filePath: string
  name: string
}

// For Nuxt 3 (Vite-based) with the updated query syntax
const modules = import.meta.glob('./*.lits', { query: '?raw', eager: true })

// Create an array of function information objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const functions: FunctionInfo[] = Object.entries(modules).map(([path, content]: [string, any]) => {
  const name = path.split('/').pop()!.replace(/\.lits$/, '')

  return {
    content: content.default || content,
    filePath: path,
    name,
  }
})

const scripts: { code: string, filePath: string }[] = functions
  .flatMap<FunctionInfo>((script) => {
    const tokenStream = lits.tokenize(script.content, { filePath: script.filePath, minify: true })
    if (tokenStream.tokens.length === 0) {
      console.warn(`${script.filePath} Empty program, skipping`)
      return []
    }

    // Add semicolon if missing
    const lastNonWhitespaceToken = tokenStream.tokens.findLast(token => token[0] !== 'Whitespace')
    if (!lastNonWhitespaceToken) {
      console.warn(`${script.filePath} Empty program, skipping`)
      return []
    }

    if (lastNonWhitespaceToken[0] !== 'Operator' || lastNonWhitespaceToken[1] !== ';') {
      tokenStream.tokens.push(['Operator', ';'])
    }

    const ast = lits.parse(tokenStream)
    if (ast.body.length !== 1) {
      throw new Error(`${script.filePath} Expected 1 expression, got ${ast.body.length}`)
    }

    lits.evaluate(ast, {})

    return {
      ...script,
      content: lits.untokenize(tokenStream),
    }
  })
  .map((func) => {
    return {
      filePath: func.filePath,
      code: `// ${func.name}\n
export let ${func.name} := ${func.content.trim()}`,
    }
  })

export const functionsScript = scripts.map(script => script.code).join('\n')

// console.log(functionsScript)
// // Export the list of function info objects for use elsewhere
// export const functionInfos: FunctionInfo[] = functions

// // Export just the filenames if needed
// export const functionFilenames: string[] = functions.map(f => f.filename)

// // Export a map of function names to content if needed
// export const functionsMap: Record<string, string> = Object.fromEntries(
//   functions.map(f => [f.name, f.content]),
// )

// function indent(str: string): string {
//   return str
//     .split('\n')
//     .map(line => '  ' + line)
//     .join('\n')
// }
