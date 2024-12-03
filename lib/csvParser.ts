import type Papa from 'papaparse'

let PapaInstance: typeof Papa | null = null

export async function parseCsv(csv: string): Promise<string[][]> {
  if (!PapaInstance) {
    PapaInstance = await import('papaparse')
  }
  return new Promise((resolve, reject) => {
    PapaInstance!.parse<string[]>(csv, {
      header: false,
      complete: result => resolve(result.data),
      error: reject,
    })
  })
}
